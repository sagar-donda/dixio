import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import * as Highcharts from 'highcharts';
import moment from 'moment';
import Highcharts from 'highcharts';
import { Papa } from 'ngx-papaparse';
import { HighchartsChartModule } from 'highcharts-angular';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import worldMapData from '@highcharts/map-collection/custom/world.geo.json';
import HC_map from 'highcharts/modules/map';
import ExportingModule from 'highcharts/modules/exporting';
import ExportData from 'highcharts/modules/export-data';
import * as XLSX from 'xlsx';
import _ from 'lodash';

ExportingModule(Highcharts);
ExportData(Highcharts);
HC_map(Highcharts);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatToolbarModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    HighchartsChartModule,
    MatGridListModule,
    CommonModule,
    MatButtonToggleModule,
    FormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptionsArray: Highcharts.Options[] = [];
  chartLabels: string[] = [];
  chartDataArray: any[] = [];
  formattedjson: any[] = [];
  filteredData: any[] = [];
  nooftransaction: number = 0;
  avgtimcompletion: string = '0h';
  avgsptrate: number = 0;
  avgfeepertransaction: number = 0;
  minimumfeepertransaction: number = 0;
  maximumfeepertransaction: number = 0;
  noofunqiueuser: number = 0;
  totalusdamount: number = 0;
  totalusdFeesInUsd: number = 0;
  chartConstructor = 'mapChart';
  private _selectedTab: string = 'snapshot';
  constructor(private cdr: ChangeDetectorRef, private papa: Papa) {}
  uniqueNetworks = ['VISA', 'SWIFT', 'Terrapay', 'Thunes', 'Nium'];
  uniqueChannels = ['Web', 'MobileApp', 'API', 'Branch'];
  uniqueDestinations = [
    'FR',
    'US',
    'BR',
    'CA',
    'DE',
    'JP',
    'CN',
    'IN',
    'UK',
    'AU',
  ];
  uniqueCurrencies = [
    'EUR',
    'USD',
    'BRL',
    'CAD',
    'CNY',
    'JPY',
    'INR',
    'AUD',
    'GBP',
  ];
  uniqueMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  selectedNetwork = ['All', ...this.uniqueNetworks];
  selectedChannel = ['Channels', ...this.uniqueChannels];
  selectedDestination = ['Destinations', ...this.uniqueDestinations];
  selectedCurrency = ['Currency', ...this.uniqueCurrencies];
  selectedDateRange = 'Date Range';
  // Display placeholder text instead of selected options
  getPlaceholderText(): string {
    return '';
  }
  excelDateToJSDate = (serial: any) => {
    if (typeof serial === 'number') {
      const baseDate = new Date(1900, 0, 1); // January 1, 1900
      return new Date(baseDate.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
    }
    if (typeof serial === 'string') {
      const [day, month, year, time] = serial.split(/[\/\s:]/);
      return new Date(`${year}-${month}-${day}T${time || '00:00'}:00`);
    }

    return serial;
  };
  getWeekNumber(date: Date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }
  // Helper function to format minutes to "XhYm" format
  formatMinutesToHoursAndMinutes(
    minutes: number,
    recoredLength: number
  ): number {
    const totalMinutes = minutes; // Round to the nearest minute if needed
    const hours = Math.floor(totalMinutes / 60); // Get the integer part as hours
    const remainingMinutes = totalMinutes % 60; // Remaining minutes
    // Format as `hours.remainingMinutes` and then divide by `recordLength`
    const formattedTime = parseFloat(`${hours}.${remainingMinutes}`);
    return totalMinutes / recoredLength;
  }
  firstweek = 0;
  performanceData(data: any) {
    const weeksInMonth = Array(5).fill(0); // Default array for up to 5 weeks in a month
    // Average Time To Completion for each week in the current month
    console.log(
      'averageTimeToCompletionData',
      data.filter((x: any) => x['Status'] === 'Completed')
    );
    const averageTimeToCompletionData = _(
      data.filter((x: any) => x['Status'] === 'Completed')
    )
      .filter((record) => record['DateSent'] && record['DateCompleted'])
      .filter((record) => {
        const dateSent =
          typeof record['DateSent'] === 'string'
            ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm')
            : moment(record['DateSent']);
        const dateCompleted =
          typeof record['DateCompleted'] === 'string'
            ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm')
            : moment(record['DateCompleted']);
        return (
          dateSent.month() === dateCompleted.month() &&
          dateSent.year() === dateCompleted.year()
        );
      })
      .groupBy((record) =>
        this.getWeekOfMonth(
          typeof record['DateCompleted'] === 'string'
            ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(record['DateCompleted']).toDate()
        )
      )
      .map((records, week) => {
        const totalMinutes = records.reduce((sum, record) => {
          const dateSent =
            typeof record['DateSent'] === 'string'
              ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm')
              : moment(record['DateSent']);
          const completeDate =
            typeof record['DateCompleted'] === 'string'
              ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm')
              : moment(record['DateCompleted']);

          const timeDifference = completeDate.diff(dateSent, 'minutes'); // Convert to minutes
          record.timeDifference = timeDifference;
          // console.log(record['DateSent'], record, completeDate, timeDifference);
          return sum + timeDifference;
        }, 0);
        return {
          week: parseInt(week, 10),
          averageCompletionTime: this.formatMinutesToHoursAndMinutes(
            totalMinutes,
            records.length
          ), // Average in minutes
          records,
          averageCompletionMinitues: totalMinutes / records.length, // Average in hours
          averageCompletion: records.length, // Average in hours
          totalMinutes,
        };
      })
      .value();

    console.log(averageTimeToCompletionData);
    const totalAvgMinutes =
      averageTimeToCompletionData.reduce(
        (a: number, b: any) => a + b.averageCompletionMinitues,
        0
      ) / averageTimeToCompletionData.length;

    // Calculate hours and exact minutes without using rounding or truncation
    const hours = totalAvgMinutes / 60;
    const wholeHours = parseInt(hours.toString().split('.')[0]); // Extract integer part as hours
    const exactMinutes = this.toFixedWithoutRounding(
      (hours - wholeHours) * 60,
      2
    ); // Exact minutes without rounding

    // Formatting the output based on whether there’s an hour component
    this.avgtimcompletion =
      wholeHours > 0
        ? `${wholeHours}h${exactMinutes}Mins`
        : `${exactMinutes}Mins`;
    const averageTimeToCompletionSeries = weeksInMonth.map((_, week) => {
      const data = averageTimeToCompletionData.find((d) => d.week === week + 1); // weeks start from 1
      return data ? data.averageCompletionTime : 0;
    });

    // Average STP Rate Data for each week in the current month
    const averageStpRateData = _(
      data.filter((x: any) => x['Status'] !== 'Pending')
    )
      .filter((record) => record['DateSent'])
      .groupBy((record) =>
        this.getWeekOfMonth(
          typeof record['DateSent'] === 'string'
            ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(record['DateSent']).toDate()
        )
      )
      .map((records, week) => {
        const completedCount = records.filter(
          (record) => record.Status === 'Completed'
        ).length;
        const failedCount = records.filter(
          (record) => record.Status === 'Failed'
        ).length;
        const stpRate = (completedCount / (completedCount + failedCount)) * 100;
        return {
          week: parseInt(week, 10),
          stpRate: stpRate,
          completedCount,
          failedCount,
          totalCount: records.length,
        };
      })
      .value();

    this.avgsptrate = this.toFixedWithoutRounding(
      averageStpRateData.reduce((a: number, b: any) => a + b.stpRate, 0) /
        averageStpRateData.length,
      2
    );

    const averageStpRateSeries = weeksInMonth.map((_, week) => {
      const data = averageStpRateData.find((d) => d.week === week + 1);
      return data ? data.stpRate : 0;
    });
    // Extracting all FeesInUsd values from the data array
    const feesArray = data
      .filter((x: any) => x['Status'] === 'Completed')
      .map((item: any) => item.FeesInUsd);

    // Finding minimum and maximum fees per transaction
    this.minimumfeepertransaction = feesArray.length
      ? Math.min(...feesArray)
      : 0;
    this.maximumfeepertransaction = feesArray.length
      ? Math.max(...feesArray)
      : 0;

    // Average Fee Per Transaction for each week in the current month
    const averageFeePerTransactionData = _(
      data.filter((x: any) => x['Status'] === 'Completed')
    )
      .filter((record) => record['DateSent'] && record['FeesInUsd'])
      .groupBy((record) =>
        this.getWeekOfMonth(
          typeof record['DateSent'] === 'string'
            ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(record['DateSent']).toDate()
        )
      )
      .map((records, week) => {
        const totalFees = records.reduce(
          (sum, record) =>
            record['id'] ? sum + parseFloat(record['FeesInUsd']) : sum + 0,
          0
        );
        return {
          week: parseInt(week, 10),
          averageFee: totalFees / records.length,
        };
      })
      .value();

    this.avgfeepertransaction = this.toFixedWithoutRounding(
      averageFeePerTransactionData.reduce(
        (a: number, b: any) => a + b.averageFee,
        0
      ) / averageFeePerTransactionData.length,
      2
    );
    const averageFeePerTransactionSeries = weeksInMonth.map((_, week) => {
      const data = averageFeePerTransactionData.find(
        (d) => d.week === week + 1
      );
      return data ? data.averageFee : 0;
    });

    // Total Fees Per Week Per Route for each week in the current month
    const totalFeesPerRouteData = _(
      data.filter((x: any) => x['Status'] === 'Completed')
    )
      .filter(
        (record) => record['DateSent'] && record['FeesInUsd'] && record['Route']
      )
      .groupBy((record) =>
        this.getWeekOfMonth(
          typeof record['DateSent'] === 'string'
            ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(record['DateSent']).toDate()
        )
      )
      .map((records, week) => {
        const routes = _.groupBy(records, 'Route');
        return {
          week: parseInt(week, 10),
          routes: Object.keys(routes).map((route) => ({
            name: route,
            totalFees: routes[route].reduce(
              (sum, record) => sum + parseFloat(record['FeesInUsd']),
              0
            ),
          })),
        };
      })
      .value();

    const totalFeesPerRouteSeries: any = {};

    totalFeesPerRouteData.forEach((data) => {
      data.routes.forEach((routeData) => {
        if (!totalFeesPerRouteSeries[routeData.name]) {
          totalFeesPerRouteSeries[routeData.name] = Array(5).fill(0); // Initialize with 0s for each week
        }
        totalFeesPerRouteSeries[routeData.name][data.week - 1] =
          routeData.totalFees;
      });
    });

    const formattedTotalFeesPerRouteSeries = Object.keys(
      totalFeesPerRouteSeries
    ).map((route, index) => ({
      index: index,
      name: route,
      data: totalFeesPerRouteSeries[route],
      type: 'column',
    }));
    // Store the results in `allchartData`
    this.allchartData['performance'] = [
      {
        title: 'Average Time To Completion',
        data: averageTimeToCompletionSeries.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: 'Mins',
        formateprefix: '',
        ytitle: 'Average time to completion',
      },
      {
        title: 'Average STP Rate',
        data: averageStpRateSeries.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: '%',
        formateprefix: '',
        ytitle: 'Average STP rate',
      },
      {
        title: 'Average Fee Per Transaction',
        data: averageFeePerTransactionSeries.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: '',
        formateprefix: '$',
        ytitle: 'Average Fee per Transaction',
      },
      {
        title: 'Total Fees Per Week Per Route',
        data: formattedTotalFeesPerRouteSeries,
        formatesuffix: '',
        formateprefix: '',
        ytitle: 'Total Fees Per Week Per Route',
      },
    ];
  }
  getWeekOfMonth(date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + startOfMonth.getDay()) / 7);
  }
  processTimeEvolutionData(data: any) {
    // Group data by week of DateSent within the current month
    const groupedData = _(data)
      .groupBy((item) => {
        const date =
          typeof item['DateSent'] === 'string'
            ? moment(item['DateSent'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(item['DateSent']).toDate();
        return `${date.getMonth()}-${this.getWeekOfMonth(date)}`; // Unique key for each week in the month
      })
      .value();

    // Initialize each metric array for chart data, assuming a maximum of 5 weeks per month
    const numberOfTransactions = Array(5).fill(0);
    const valueOfTransactions = Array(5).fill(0);
    const avgValuePerTransaction = Array(5).fill(0);
    const uniqueUsers = Array(5).fill(0);

    // Populate each metric
    Object.keys(groupedData).forEach((weekKey) => {
      const [month, week] = weekKey.split('-').map(Number); // Split key to get month and week
      const weekIndex = week - 1; // Array index for each week
      const weekData = groupedData[weekKey];

      // Number of Transactions
      numberOfTransactions[weekIndex] = weekData.length;

      // Value of Transactions (Sum of AmountInUSD)
      valueOfTransactions[weekIndex] = _.sumBy(weekData, 'AmountInUSD');

      // Average Value Per Transaction
      avgValuePerTransaction[weekIndex] =
        valueOfTransactions[weekIndex] / (numberOfTransactions[weekIndex] || 1);

      // Number of Unique Users (count of unique InitiatorId)
      uniqueUsers[weekIndex] = _.uniqBy(weekData, 'InitiatorId').length;
    });

    // Prepare each chart's data
    this.allchartData['time-evolution'] = [
      {
        title: 'Number Of Transactions',
        data: numberOfTransactions.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: '',
        formateprefix: '',
      },
      {
        title: 'Value Of Transactions',
        data: valueOfTransactions.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: 'USD',
        formateprefix: '$',
      },
      {
        title: 'Average Value Per Transaction',
        data: avgValuePerTransaction.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: 'USD',
        formateprefix: '$',
      },
      {
        title: 'Number Of Unique Users',
        data: uniqueUsers.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: '',
        formateprefix: '',
      },
    ];
  }

  clearFilters() {
    this.selectedNetwork = ['Networks'];
    this.selectedChannel = ['Channels'];
    this.selectedDestination = ['Destinations'];
    this.selectedCurrency = ['Currency'];
    this.selectedDateRange = 'Date Range';

    this.filterData(); // Re-apply filter with default values
  }
  // Check if "All" option should be selected (i.e., all individual options are selected)
  isAllSelected(category: string): boolean {
    switch (category) {
      case 'networks':
        return this.selectedNetwork.length === this.uniqueNetworks.length + 1;
      case 'channels':
        return this.selectedChannel.length === this.uniqueChannels.length + 1;
      case 'destinations':
        return (
          this.selectedDestination.length === this.uniqueDestinations.length + 1
        );
      case 'currencies':
        return (
          this.selectedCurrency.length === this.uniqueCurrencies.length + 1
        );
      default:
        return false;
    }
    this.filterData(); // Re-apply filter with default values
  }

  // Toggle selection for all options when "All" checkbox is clicked
  toggleAllSelection(category: string, isChecked: boolean) {
    switch (category) {
      case 'networks':
        this.selectedNetwork = isChecked ? ['All', ...this.uniqueNetworks] : [];
        break;
      case 'channels':
        this.selectedChannel = isChecked ? ['All', ...this.uniqueChannels] : [];
        break;
      case 'destinations':
        this.selectedDestination = isChecked
          ? ['All', ...this.uniqueDestinations]
          : [];
        break;
      case 'currencies':
        this.selectedCurrency = isChecked
          ? ['All', ...this.uniqueCurrencies]
          : [];
        break;
    }
    this.filterData(); // Re-apply filter with default values
  }

  // Handle individual selection changes
  onSelectionChange(category: string) {
    switch (category) {
      case 'networks':
        if (this.isAllSelected('networks')) {
          this.selectedNetwork = ['All', ...this.uniqueNetworks];
        } else {
          this.selectedNetwork = this.selectedNetwork.filter(
            (item) => item !== 'All'
          );
          if (this.selectedNetwork.length === 0) {
            this.selectedNetwork = ['Networks'];
          }
        }
        break;
      case 'channels':
        if (this.isAllSelected('channels')) {
          this.selectedChannel = ['All', ...this.uniqueChannels];
        } else {
          this.selectedChannel = this.selectedChannel.filter(
            (item) => item !== 'All'
          );
        }
        break;
      case 'destinations':
        if (this.isAllSelected('destinations')) {
          this.selectedDestination = ['All', ...this.uniqueDestinations];
        } else {
          this.selectedDestination = this.selectedDestination.filter(
            (item) => item !== 'All'
          );
        }
        break;
      case 'currencies':
        if (this.isAllSelected('currencies')) {
          this.selectedCurrency = ['All', ...this.uniqueCurrencies];
        } else {
          this.selectedCurrency = this.selectedCurrency.filter(
            (item) => item !== 'All'
          );
        }
        break;
    }
    this.filterData();
  }
  getLastThreeMonths() {
    const today = new Date();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    let months = [];

    for (let i = 2; i >= 0; i--) {
      let monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(monthNames[monthDate.getMonth()]);
    }

    return months;
  }

  filterData() {
    const today = moment();
    let startDate: moment.Moment, endDate: moment.Moment;
    let currentMonth: string = 'Oct';

    switch (this.selectedDateRange) {
      case 'today':
        startDate = today.startOf('day');
        endDate = today.endOf('day');
        break;
      case 'week':
        startDate = today.startOf('week');
        endDate = today.endOf('week');
        break;
      case 'month':
        startDate = today.startOf('month');
        endDate = today.endOf('month');
        break;
      case 'year':
        startDate = today.startOf('year');
        endDate = today.endOf('year');
        break;
      case 'sep':
        startDate = moment().month(8).startOf('month'); // September (0-indexed, so 8 is September)
        endDate = moment().month(8).endOf('month'); // September
        break;
      case 'aug':
        startDate = moment().month(7).startOf('month'); // August (0-indexed, so 7 is August)
        endDate = moment().month(7).endOf('month'); // August
        break;
    }
    // Filtering logic based on selected values
    this.filteredData = this.formattedjson.filter((item) => {
      // Parse item['DateSent'] with the correct format
      const itemDate = moment(item['DateSent'], 'DD/MM/YYYY HH:mm');

      return (
        (this.selectedNetwork.includes('Networks') ||
          this.selectedNetwork.includes(item['Route'])) &&
        (this.selectedChannel.includes('Channels') ||
          this.selectedChannel.includes(item['InitiationChannel'])) &&
        (this.selectedDestination.includes('Destinations') ||
          this.selectedDestination.includes(item['DestinationCountry'])) &&
        (this.selectedCurrency.includes('Currency') ||
          this.selectedCurrency.includes(item['Currency'])) &&
        (this.selectedDateRange === 'Date Range' ||
          moment(itemDate, 'DD/MM/YYYY HH:mm').isBetween(
            startDate,
            endDate,
            null,
            '[]'
          ))
      );
    });

    this.nooftransaction = this.filteredData.filter(
      (x: any) => x['Status'] === 'Completed'
    ).length;

    this.totalusdamount = this.filteredData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => a + (b['AmountInUSD'] | 0), 0);
    this.totalusdFeesInUsd = this.filteredData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => a + (b['FeesInUsd'] | 0), 0);
    this.noofunqiueuser = _.uniqBy(
      this.filteredData.filter((x: any) => x['Status'] === 'Completed'),
      'InitiatorId'
    ).length;
    // Process the filtered data

    this.processData(this.filteredData, 'snapshot');
    this.processData(this.filteredData, 'time-evolution');
    this.processData(this.filteredData, 'map');
    this.processData(this.filteredData, 'performance');
  }

  ngOnInit(): void {
    this.updateChartList();
    this.processData([], 'snapshot');
  }

  get selectedTab(): string {
    return this._selectedTab;
  }

  set selectedTab(value: string) {
    this._selectedTab = value;
    this.processData(this.formattedjson, this._selectedTab); // Call updateChartList whenever selectedTab changes
    this.updateChartList(); // Call updateChartList whenever selectedTab changes
  }

  // Networks
  networks = ['All', 'TerraPay', 'Swift', 'Thunes', 'Visa Direct'];

  // Destinations
  corridors = ['All', 'India', 'Pakistan', 'Egypt', 'Etc.'];

  // Channels
  channels = ['All', 'Mobile App', 'Web Portal', 'Branch'];

  // Date Range
  dateRanges = [
    'MTD', // Month to Date
    'Last 30 days',
    'Last 90 days',
    'YTD', // Year to Date
    'TTM', // Trailing Twelve Months
    'Custom',
  ];

  // Currency
  currencies = ['USD', 'BRL', 'CAD', 'CNY', 'JPY', 'INR', 'AUD', 'GBP'];

  allchartDataTabs: any = {};
  allchartData: any = {
    snapshot: [],
    'time-evolution': [],
    performance: [],
  };
  mapData: any[] = []; // Array to store dynamic map data
  titleMap: any = {
    snapshot: [
      'Currency Split By Value (USD)',
      'Currency Split By Volume (# Of Transactions)',
      'Network Split By Value (USD)',
      'Network Split By Volume (# Of Transactions)',
      'Top Destinations By Value (USD)',
      'Top Destinations By Volume (# Of Transactions)',
      'Channels Split By Value (USD)',
      'Channels Split By Volume (# Of Transactions)',
    ],
    'time-evolution': [
      'Number Of Transactions',
      'Value Of Transactions',
      'Average Value Per Transaction',
      'Number Of Unique Users',
    ],
    performance: [
      'Average Time To Completion',
      'Average STP Rate',
      'Average Fee Per Transaction',
      'Total Fees Per Month Per Route',
    ],
  };

  processData(data: any[], tabname: string) {
    if (tabname === 'snapshot') {
      data = data.filter((x) => x['Status'] === 'Completed');
      const colors = [
        '#007bff', // Blue
        '#9b59b6', // Purple
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#8e44ad', // Dark Purple
        '#1abc9c', // Teal
        '#f39c36', // Default color for "Others"
      ];

      // Initialize or reset the target array for the specified tab
      this.allchartData[tabname] = [];

      // Process data for each title in the current tab
      this.titleMap[tabname].forEach((title: string) => {
        // Determine grouping key and summing field based on title
        let groupingKey = '';
        let summingField = 'AmountInUSD'; // Default summing field for value-based titles
        let isVolumeBased = false;

        // Set grouping key and aggregation type based on the title
        if (title.includes('Currency')) groupingKey = 'Currency';
        else if (title.includes('Network')) groupingKey = 'Route';
        else if (title.includes('Top Destinations'))
          groupingKey = 'DestinationCountry';
        else if (title.includes('Channels')) groupingKey = 'InitiationChannel';

        // Check if the title is volume-based (count of transactions)
        if (title.includes('Volume')) {
          summingField = 'id'; // Use transaction count
          isVolumeBased = true;
        }

        // Filter to only "Completed" transactions
        const completedTransactions = data.filter(
          (tx) => tx['Status'] === 'Completed'
        );

        // Group and aggregate data
        const groupedData = _(completedTransactions)
          .groupBy(groupingKey)
          .map((items: any, key: any) => ({
            name: key,
            value: isVolumeBased ? items.length : _.sumBy(items, summingField),
          }))
          .orderBy('value', 'desc')
          .value();

        // Calculate total for percentage calculation
        const totalValue = _.sumBy(groupedData, 'value');

        // Format data to include name, value, percentage, and assign colors by index
        const formattedData = groupedData.map((item: any, index: number) => ({
          name: item.name,
          value: item.value,
          percentage: this.toFixedWithoutRounding(
            (item.value / totalValue) * 100,
            3
          ),
          color: colors[index] || colors[colors.length - 1], // Assign color by index, defaulting to the last color for "Others"
        }));

        // Separate top 6 items and group the rest as "Others"
        const topItems = formattedData.slice(0, 6);
        const otherItems = formattedData.slice(6);

        const others = {
          name: 'Others',
          value: _.sumBy(otherItems, 'value'),
          percentage: this.toFixedWithoutRounding(
            _.sumBy(otherItems, 'percentage'),
            1
          ),
          color: colors[colors.length - 1],
        };

        // Create result object for each title and add to the array
        const result = {
          title: title,
          data: [...topItems, others],
        };

        // Push result to allchartData for the specific tab
        this.allchartData[tabname].push(result);
      });

      // Update chart data based on the latest changes
      this.updateChartList();
    } else if (tabname === 'time-evolution') {
      data = data.filter((x) => x['Status'] !== 'Pending');
      this.processTimeEvolutionData(data);
      // Update chart data based on the latest changes
      this.updateChartList();
    } else if (tabname === 'map') {
      data = data.filter((x) => x['Status'] !== 'Pending');
      this.generateMapData(data);
      // Update chart data based on the latest changes
      this.updateChartList();
    } else if (tabname === 'performance') {
      data = data.filter((x) => x['Status'] !== 'Pending');
      this.performanceData(data);

      // Update chart data based on the latest changes
      this.updateChartList();
    }

    this.cdr.detectChanges();
  }

  determineGroupingKey(tabname: string) {
    return tabname.includes('network')
      ? 'Route'
      : tabname.includes('destination')
      ? 'DestinationCountry'
      : tabname.includes('channels')
      ? 'InitiationChannel'
      : 'Currency';
  }

  determineSummingField(tabname: string) {
    return tabname.includes('volume') ? 'id' : 'AmountInUSD';
  }
  toFixedWithoutRounding(value: number, decimals: number) {
    const factor = Math.pow(10, decimals);
    return Math.floor(value * factor) / factor;
  }
  parseCsv(csvData: string): void {
    this.papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        result.data.forEach((row: any) => {
          for (const key in row) {
            let cellValue = row[key];

            if (typeof cellValue === 'string') {
              // If the string is a valid date in DD/MM/YYYY or D/M/YY format
              if (
                /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(
                  cellValue
                )
              ) {
                cellValue = moment(cellValue, 'DD/MM/YYYY HH:mm').format(
                  'MM/DD/YYYY HH:mm'
                );
              }
              // If the string is a number with commas as thousand separators or plain numbers
              else if (
                /^\d{1,3}(,\d{3})*$/.test(cellValue) ||
                /^\d+$/.test(cellValue)
              ) {
                cellValue = parseInt(cellValue.replace(/,/g, ''), 10);
              }
              // If the string is a number with a decimal point (dot) or comma as decimal separator
              else if (
                /^\d+(\.\d+)?$/.test(cellValue) ||
                /^\d+,\d+$/.test(cellValue)
              ) {
                cellValue = parseFloat(cellValue.replace(/,/g, '.'));
              }
            }

            // Update the row with the processed cell value
            row[key] = cellValue;
          }
        });
        this.formattedjson = result.data;

        this.extractdata();
      },
    });
  }
  formatValue = (value: number) => {
    let absValue = value;
    let suffix = ''; // Initialize an empty suffix

    if (absValue >= 1_000_000_000) {
      value = value / 1_000_000_000;
      suffix = 'B'; // Billions
    } else if (absValue >= 1_000_000) {
      value = value / 1_000_000;
      suffix = 'M'; // Millions
    } else if (absValue >= 1_000) {
      value = value / 1_000;
      suffix = 'K'; // Thousands
    }
    if (isNaN(value)) return '0.00';
    return `${this.toFixedWithoutRounding(value, 2)}${suffix}`;
  };

  getTitleIndex(tabname: string) {
    const titleIndexes: any = {
      snapshot: 0,
      volume: 1,
      networkValue: 2,
      networkVolume: 3,
      destinationValue: 4,
      destinationVolume: 5,
      channelsValue: 6,
      channelsVolume: 7,
    };
    return titleIndexes[tabname] || 0;
  }

  processWorkbook(wb: XLSX.WorkBook) {
    const wsname: string = wb.SheetNames[0];
    const ws: XLSX.WorkSheet = wb.Sheets[wsname];

    // Convert sheet data to array of objects
    const data: any[] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
    });

    const headers = data[0]; // Extract headers (first row)
    const rows = data.slice(1); // Remaining rows

    this.formattedjson = rows.map((row) => {
      const rowObject: { [key: string]: any } = {};
      headers.forEach((header: string, index: number) => {
        let cellValue = row[index];

        // Convert numeric fields
        if (typeof cellValue === 'string') {
          // If the string is a valid date in DD/MM/YYYY or D/M/YY format
          if (
            /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(
              cellValue
            )
          ) {
            cellValue = moment(cellValue, 'DD/MM/YYYY HH:mm').format(
              'MM/DD/YYYY HH:mm'
            );
            // cellValue = new Date(cellValue);
          }
          // If the string is a number with commas as thousand separators or plain numbers
          else if (
            /^\d{1,3}(,\d{3})*$/.test(cellValue) ||
            /^\d+$/.test(cellValue)
          ) {
            cellValue = parseInt(cellValue.replace(/,/g, ''), 10);
          }
          // If the string is a number with a decimal point (dot) or comma as decimal separator
          else if (
            /^\d+(\.\d+)?$/.test(cellValue) ||
            /^\d+,\d+$/.test(cellValue)
          ) {
            cellValue = parseFloat(cellValue.replace(/,/g, '.'));
          }
        }

        rowObject[header] = cellValue;
      });
      return rowObject;
    });
    this.extractdata();
  }
  extractdata() {
    this.nooftransaction = this.formattedjson.filter(
      (x) => x['Status'] === 'Completed'
    ).length;

    this.totalusdamount = this.formattedjson
      .filter((x) => x['Status'] === 'Completed')
      .reduce((a, b) => {
        return a + b['AmountInUSD'];
      }, 0);
    this.totalusdFeesInUsd = this.formattedjson
      .filter((x) => x['Status'] === 'Completed')
      .reduce((a, b) => a + b['FeesInUsd'], 0);
    this.noofunqiueuser = _.uniqBy(
      this.formattedjson.filter((x) => x['Status'] === 'Completed'),
      'InitiatorId'
    ).length;

    this.processData(this.formattedjson, 'snapshot');
  }
  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;

    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }

    const file = target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Handle CSV file
        const csvData = e.target.result;
        this.parseCsv(csvData);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel file
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        this.processWorkbook(wb);
      } else {
        alert('Unsupported file format. Please upload an Excel or CSV file.');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file); // For CSV files
    } else {
      reader.readAsBinaryString(file); // For Excel files
    }
  }
  // Function to generate daily data points for a year
  generateDailyData(): [number, number][] {
    const data: any = [];
    const startDate = new Date(2024, 0, 1).getTime(); // January 1, 2024
    const daysInYear = 365;

    for (let i = 0; i < daysInYear; i++) {
      const date = startDate + i * 24 * 60 * 60 * 1000; // Increment day by day
      const transactions = Math.floor(Math.random() * 100000); // Random transactions between 0 and 100,000
      data.push(transactions);
    }

    return data;
  }

  updateChartList() {
    this.allchartDataTabs = this.getAllChartDataTabs();
    const selectedData = this.allchartDataTabs[this._selectedTab];
    const selectedChartData = this.allchartData[this._selectedTab];
    this.chartOptionsArray = selectedData || [];
    this.chartDataArray = selectedChartData || [];
  }

  // Function to generate map data dynamically
  generateMapData(data: any) {
    // Group by country code and calculate metrics
    const groupedData = _(data)
      .groupBy('DestinationCountry')
      .map((transactions, code) => ({
        code: code,
        name: transactions[0].countryName || code, // Use country name if available
        transactions: transactions.length,
        z: transactions.length,
        totalValue: _.sumBy(transactions, 'AmountInUSD'),
        avgValue: _.meanBy(transactions, 'AmountInUSD'),
        users: _.uniqBy(transactions, 'InitiatorId').length,
        feesPaid: _.sumBy(transactions, 'FeesInUsd') || 0,
      }))
      .value();
    this.mapData = groupedData;
  }

  getAllChartDataTabs() {
    return {
      snapshot: this.allchartData['snapshot'].map((chart: any) => {
        // Create a new data array excluding the 'percentage' field
        const chartData = chart.data.map(({ name, value, color }: any) => ({
          name,
          y: value, // Highcharts expects 'y' for the value
          color,
        }));

        // Return a new chartOptions object for each chart
        return {
          chart: {
            type: 'pie',
          },
          title: {
            text: '', // Disable the chart title
            align: 'left' as 'left', // This can be removed as it has no effect when the title is null
            widthAdjust: 100, // This can also be removed if there is no title
          },
          tooltip: {
            headerFormat: '',
            pointFormat:
              '<span style="color:{point.color}">\u25cf</span> {point.name}: <b>{point.y:.0f}</b>',
          },
          accessibility: {
            point: {
              valueSuffix: '%',
            },
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              borderWidth: 2,
              cursor: 'pointer',
              dataLabels: {
                enabled: false,
                format: '<b>{point.name}</b>',
                distance: 20,
              },
            },
          },
          series: [
            {
              type: 'pie',
              enableMouseTracking: true,
              innerSize: '40%',
              borderRadius: 8,
              animation: {
                duration: 2000,
              },
              name: 'Value',
              data: chartData, // Use the new chartData array without 'percentage'
            },
          ],
        };
      }),
      'time-evolution': this.allchartData['time-evolution'].map(
        (chart: any) => {
          // Create a new data array excluding the 'percentage' field
          const chartData = chart.data.map(({ name, value, color }: any) => ({
            name,
            y: value, // Highcharts expects 'y' for the value
            color,
          }));

          // Return a new chartOptions object for each chart
          return {
            chart: {
              type: 'line',
            },
            credits: {
              enabled: false,
            },
            title: {
              text: '',
            },
            xAxis: {
              categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
              title: {
                text: '',
              },
            },
            yAxis: {
              title: {
                text: chart.name,
              },
              labels: {
                formatter: function () {
                  let value = (this as any).value;
                  const absValue = Math.abs(value);

                  let suffix = ''; // Initialize an empty suffix

                  if (absValue >= 1_000_000_000) {
                    value = value / 1_000_000_000;
                    suffix = 'B'; // Billions
                  } else if (absValue >= 1_000_000) {
                    value = value / 1_000_000;
                    suffix = 'M'; // Millions
                  } else if (absValue >= 1_000) {
                    value = value / 1_000;
                    suffix = 'K'; // Thousands
                  }

                  // Apply rounding based on the prefix condition
                  if (chart.formateprefix !== '$') {
                    // Round to an integer
                    value = Math.round(value);
                  } else {
                    // Keep one decimal place if prefix is '$'
                    value = value.toFixed(1);
                  }

                  return `${chart.formateprefix || ''}${value}${suffix}`;
                },
              },
            },
            // tooltip: {
            //   headerFormat: '',
            //   pointFormat: '{point.name} <b>{point.y:.0f}</b>',
            // },
            tooltip: {
              pointFormat: `<b>${chart.formateprefix}{point.y:.1f}${chart.formatesuffix} </b>`,
            },
            series: [
              {
                name: '',
                data: chartData, // Example data
                lineWidth: 1,
              },
            ],
            legend: {
              enabled: false, // Hide the legend
            },
            plotOptions: {},
          };
        }
      ),
      map: [
        {
          chart: {
            map: worldMapData,
            borderWidth: 0,
          },
          title: {
            text: 'Global Transaction Data',
            align: 'center',
          },
          mapNavigation: {
            enabled: false,
            buttonOptions: {
              alignTo: 'spacingBox',
              verticalAlign: 'bottom',
            },
          },
          colorAxis: {
            min: 0,
            stops: [
              [0, '#9BD4FB'], // Outer gradient color
              [0.5, '#9BD4FB'], // Middle gradient color
              [1, '#9BD4FB'], // Inner gradient color
            ],
          },
          tooltip: {
            useHTML: true,
            backgroundColor: '#0F2030',
            borderColor: '#33475B',
            borderRadius: 8.14,
            style: {
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
            },
            formatter: function () {
              const point = (this as any).point;

              // Helper function to format values with suffixes
              const formatValue = (value: number) => {
                let absValue = Math.abs(value);
                let suffix = ''; // Initialize an empty suffix

                if (absValue >= 1_000_000_000) {
                  value = value / 1_000_000_000;
                  suffix = 'B'; // Billions
                } else if (absValue >= 1_000_000) {
                  value = value / 1_000_000;
                  suffix = 'M'; // Millions
                } else if (absValue >= 1_000) {
                  value = value / 1_000;
                  suffix = 'K'; // Thousands
                }

                return `$${value.toFixed(2)}${suffix}`;
              };

              // Generate the flag icon based on country code
              const flagIcon = `<span class="fi fi-${point.code.toLowerCase()}" style="display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; border-radius: 50%; background-color: #ffffff; margin-bottom: 8px; font-size: 24px;"></span>`;

              // Tooltip content with flag
              return `
                <div style="padding: 6px; background-color: #0F2030; color: #ffffff; border-radius: 8px; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center;">
                  <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0px;">
                    ${flagIcon}
                  </div>
                  <table style="width: 100%; color: #ffffff; font-size: 14px; border-collapse: collapse;">
                    <tr style="margin-bottom: 8px;">
                      <th style="text-align: left; color: #ffffff; font-weight: bold;">Beneficiary Country:</th>
                      <td style="text-align: right; font-weight: bold; color: #ffffff;">${
                        point.name
                      }</td>
                    </tr>
                    <tr>
                      <td style="text-align: left;"># of Transactions:</td>
                      <td style="text-align: right; font-weight: bold;">${Number(
                        point.transactions
                      ).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="text-align: left;">Total Value:</td>
                      <td style="text-align: right; font-weight: bold;">${formatValue(
                        point.totalValue
                      )}</td>
                    </tr>
                    <tr>
                      <td style="text-align: left;">Avg. Transaction Value:</td>
                      <td style="text-align: right; font-weight: bold;">${formatValue(
                        point.avgValue
                      )}</td>
                    </tr>
                    <tr>
                      <td style="text-align: left;"># of Unique Users:</td>
                      <td style="text-align: right; font-weight: bold;">${Number(
                        point.users
                      ).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style="text-align: left;">Total Fees Paid:</td>
                      <td style="text-align: right; font-weight: bold;">${formatValue(
                        point.feesPaid
                      )}</td>
                    </tr>
                  </table>
                </div>
              `;
            },
          },
          series: [
            {
              type: 'map',
              name: 'World Map',
              mapData: worldMapData,
              borderColor: '#B1BBCA',
              nullColor: '#D4D8E0',
              showInLegend: false,
            },
            {
              type: 'mapbubble',
              name: 'Transactions',
              joinBy: ['iso-a2', 'code'],
              data: this.mapData, // Use dynamic map data here
              maxSize: '15%',
              color: {
                linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
                stops: [
                  [0, '#9BD4FB'],
                  [0.5, '#9BD4FB'],
                  [1, '#9BD4FB'],
                ],
              },
              marker: {
                lineWidth: 2,
                lineColor: '#ffffff',
              },
            },
          ],
        },
      ],
      performance: this.allchartData['performance'].map(
        (chart: any, index: number) => {
          // Create a new data array excluding the 'percentage' field
          const chartData = chart.data.map(({ name, value, color }: any) => ({
            name,
            y: value, // Highcharts expects 'y' for the value
            color,
          }));

          // Return a new chartOptions object for each chart
          return index === 3
            ? {
                chart: {
                  type: 'column',
                },
                title: {
                  text: 'Total fees per month per route',
                },
                xAxis: {
                  categories: [
                    'Week 1',
                    'Week 2',
                    'Week 3',
                    'Week 4',
                    'Week 5',
                  ],
                },
                yAxis: {
                  min: 0,
                  reversedStacks: false, // Larger bars at the bottom
                  title: {
                    text: 'Total fees per month per route',
                  },
                },
                legend: {
                  enabled: true, // Hide the legend
                },
                tooltip: {
                  pointFormat: '<b>${point.y:.2f} </b>',
                },
                plotOptions: {
                  column: {
                    stacking: 'normal',
                  },
                },
                shared: true,
                series: chart.data,
              }
            : {
                chart: {
                  type: 'line',
                },
                credits: {
                  enabled: false,
                },
                title: {
                  text: '',
                },
                tooltip: {
                  pointFormat: `<b>${chart.formateprefix}{point.y:.1f}${chart.formatesuffix} </b>`,
                },
                xAxis: {
                  categories: [
                    'Week 1',
                    'Week 2',
                    'Week 3',
                    'Week 4',
                    'Week 5',
                  ],
                },
                yAxis: {
                  title: {
                    text: chart.ytitle,
                  },
                  labels: {
                    format: `${chart.formateprefix}{value}${chart.formatesuffix}`, // Format labels as '{value} m'
                  },
                },
                legend: {
                  enabled: false, // Hide the legend
                },
                series: [
                  {
                    name: '',
                    data: chartData, // Example data
                    lineWidth: 1,
                  },
                ],
              };
        }
      ),
    };
  }
}
