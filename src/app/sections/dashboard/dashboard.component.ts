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
import formattedData from '../../../../public/assets/formattedData';
// import data as defaultformattedData from 'assets/formatted';

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
  formattedjson: any[] = formattedData.map((x) => {
    return {
      ...x,
      FeesInUsd:
        x.FeesInUsd === 'string'
          ? parseFloat(x.FeesInUsd.replace(',', '.'))
          : x.FeesInUsd,
    };
  });
  filteredData: any[] = [];
  filteredWithoutDateData: any[] = [];
  days: any[] = [];
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
  constructor(private cdr: ChangeDetectorRef, private papa: Papa) {
    console.log(this.formattedjson);
  }
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
  selectedChannel = ['All', ...this.uniqueChannels];
  selectedDestination = ['All', ...this.uniqueDestinations];
  selectedCurrency = ['All', ...this.uniqueCurrencies];
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
    // Get the number of days in the current month
    const daysInMonth = moment().daysInMonth();
    const daysInMonthArray = Array(daysInMonth).fill(0);

    // Average Time To Completion for each day in the current month
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
        typeof record['DateCompleted'] === 'string'
          ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm').format('DD')
          : moment(record['DateCompleted']).format('DD')
      )
      .map((records, day) => {
        const totalMinutes = records.reduce((sum, record) => {
          const dateSent =
            typeof record['DateSent'] === 'string'
              ? moment(record['DateSent'], 'DD/MM/YYYY HH:mm')
              : moment(record['DateSent']);
          const completeDate =
            typeof record['DateCompleted'] === 'string'
              ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm')
              : moment(record['DateCompleted']);

          const timeDifference = completeDate.diff(dateSent, 'minutes');
          return sum + timeDifference;
        }, 0);
        return {
          day: parseInt(day, 10),
          averageCompletionTime: this.formatMinutesToHoursAndMinutes(
            totalMinutes,
            records.length
          ),
          averageCompletionMinutes: totalMinutes / records.length,
          averageCompletion: records.length,
          totalMinutes,
        };
      })
      .value();

    const totalAvgMinutes =
      averageTimeToCompletionData.reduce(
        (a: number, b: any) => a + b.averageCompletionMinutes,
        0
      ) / averageTimeToCompletionData.length;

    const hours = totalAvgMinutes / 60;
    const wholeHours = parseInt(hours.toString().split('.')[0]);
    const exactMinutes = this.toFixedWithoutRounding(
      (hours - wholeHours) * 60,
      2
    );

    this.avgtimcompletion =
      wholeHours > 0
        ? `${wholeHours}H ${exactMinutes}Mins`
        : isNaN(exactMinutes)
        ? '0Mins'
        : `${exactMinutes}Mins`;

    const averageTimeToCompletionSeries = daysInMonthArray.map((_, day) => {
      const data = averageTimeToCompletionData.find((d) => d.day === day + 1); // days start from 1
      return data ? data.averageCompletionTime : 0;
    });

    // Average STP Rate Data for each day in the current month
    const averageStpRateData = _(
      data.filter((x: any) => x['Status'] !== 'Pending')
    )
      .filter((record) => record['DateSent'])
      .groupBy((record) =>
        typeof record['DateCompleted'] === 'string'
          ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm').format('DD')
          : moment(record['DateCompleted']).format('DD')
      )
      .map((records, day) => {
        const completedCount = records.filter(
          (record) => record.Status === 'Completed'
        ).length;
        const failedCount = records.filter(
          (record) => record.Status === 'Failed'
        ).length;
        const stpRate = (completedCount / (completedCount + failedCount)) * 100;
        return {
          day: parseInt(day, 10),
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

    const averageStpRateSeries = daysInMonthArray.map((_, day) => {
      const data = averageStpRateData.find((d) => d.day === day + 1);
      return data ? data.stpRate : 0;
    });
    const feesArray = data
      .filter((x: any) => x['Status'] === 'Completed')
      .map((item: any) =>
        typeof item.FeesInUsd === 'number'
          ? item.FeesInUsd
          : parseFloat(item.FeesInUsd.replace(',', '.'))
      );

    // Finding minimum and maximum fees per transaction
    this.minimumfeepertransaction = feesArray.length
      ? Math.min(...feesArray)
      : 0;
    this.maximumfeepertransaction = feesArray.length
      ? Math.max(...feesArray)
      : 0;

    // Average Fee Per Transaction for each day in the current month
    const averageFeePerTransactionData = _(
      data.filter((x: any) => x['Status'] !== 'Pending')
    )
      .filter((record) => record['DateSent'] && record['FeesInUsd'])
      .groupBy((record) =>
        typeof record['DateCompleted'] === 'string'
          ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm').format('DD')
          : moment(record['DateCompleted']).format('DD')
      )
      .map((records, day) => {
        const totalFees = records.reduce(
          (sum, record) =>
            record['id'] ? sum + parseFloat(record['FeesInUsd']) : sum + 0,
          0
        );
        return {
          day: parseInt(day, 10),
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

    const averageFeePerTransactionSeries = daysInMonthArray.map((_, day) => {
      const data = averageFeePerTransactionData.find((d) => d.day === day + 1);
      return data ? data.averageFee : 0;
    });

    // Initialize an object to hold the total fees per route for each of the last 12 months
    const totalFeesPerRouteSeries: any = {};

    // Get the last 12 months, including the current month
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = moment().subtract(i, 'months');
      return {
        month: date.format('MMMM'),
        monthIndex: date.month(),
        year: date.year(),
      };
    }).reverse(); // Reverse to get the months in chronological order

    // Loop through each of the last 12 months to calculate total fees per route
    last12Months.forEach(({ monthIndex, year }, index) => {
      const monthData = this.filteredWithoutDateData.filter((record: any) => {
        const dateCompleted =
          typeof record['DateCompleted'] === 'string'
            ? moment(record['DateCompleted'], 'DD/MM/YYYY HH:mm')
            : moment(record['DateCompleted']);
        return (
          dateCompleted.month() === monthIndex && dateCompleted.year() === year
        );
      });

      // Group by route and calculate total fees for each route in the current month
      const groupedData = _(monthData)
        .filter(
          (record) =>
            record['DateSent'] && record['FeesInUsd'] && record['Route']
        )
        .groupBy('Route')
        .map((records, route) => {
          const totalFees = records.reduce(
            (sum, record) => sum + parseFloat(record['FeesInUsd']),
            0
          );
          return { route, totalFees };
        })
        .value();

      // Populate the totalFeesPerRouteSeries object with the monthly data
      groupedData.forEach((routeData) => {
        if (!totalFeesPerRouteSeries[routeData.route]) {
          totalFeesPerRouteSeries[routeData.route] = Array(12).fill(0); // Initialize with 0s for each month
        }
        totalFeesPerRouteSeries[routeData.route][index] = routeData.totalFees;
      });
    });

    // Format the data for charting
    const formattedTotalFeesPerRouteSeries = Object.keys(
      totalFeesPerRouteSeries
    ).map((route, index) => ({
      index: index,
      name: route,
      data: totalFeesPerRouteSeries[route],
      type: 'column',
    }));

    console.log(
      averageTimeToCompletionSeries.map((x) => ({
        value: this.toFixedWithoutRounding(x, 2),
      }))
    );
    // Store the results in `allchartData`
    this.allchartData['performance'] = [
      {
        title: 'Average Time To Completion',
        data: averageTimeToCompletionSeries.map((x) => ({
          value: this.toFixedWithoutRounding(x, 2),
        })),
        formatesuffix: ' Mins',
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
        title: 'Total Fees Per Day Per Route',
        data: formattedTotalFeesPerRouteSeries,
        formatesuffix: '',
        formateprefix: '',
        ytitle: 'Total Fees Per Day Per Route',
      },
    ];
  }

  getWeekOfMonth(date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + startOfMonth.getDay()) / 7);
  }
  processTimeEvolutionData(data: any) {
    // Group data by day of DateSent within the current month
    const groupedData = _(data)
      .groupBy((item) => {
        const date =
          typeof item['DateSent'] === 'string'
            ? moment(item['DateSent'], 'DD/MM/YYYY HH:mm').toDate()
            : moment(item['DateSent']).toDate();
        return `${date.getMonth() + 1}-${date.getDate()}`; // Unique key for each day in the month
      })
      .value();

    // Get the number of days in the current month for initializing arrays
    const daysInMonth = moment().daysInMonth();

    // Initialize each metric array for chart data, assuming a maximum of days in the current month
    const numberOfTransactions = Array(daysInMonth).fill(0);
    const valueOfTransactions = Array(daysInMonth).fill(0);
    const avgValuePerTransaction = Array(daysInMonth).fill(0);
    const uniqueUsers = Array(daysInMonth).fill(0);

    // Populate each metric
    Object.keys(groupedData).forEach((dayKey) => {
      const [month, day] = dayKey.split('-').map(Number); // Split key to get month and day
      const dayIndex = day - 1; // Array index for each day
      const dayData = groupedData[dayKey];

      // Number of Transactions
      numberOfTransactions[dayIndex] = dayData.length;

      // Value of Transactions (Sum of AmountInUSD)
      valueOfTransactions[dayIndex] = _.sumBy(dayData, 'AmountInUSD');

      // Average Value Per Transaction
      avgValuePerTransaction[dayIndex] =
        valueOfTransactions[dayIndex] / (numberOfTransactions[dayIndex] || 1);

      // Number of Unique Users (count of unique InitiatorId)
      uniqueUsers[dayIndex] = _.uniqBy(dayData, 'InitiatorId').length;
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
    this.selectedNetwork = ['All', ...this.uniqueNetworks];
    this.selectedChannel = ['All', ...this.uniqueChannels];
    this.selectedDestination = ['All', ...this.uniqueDestinations];
    this.selectedCurrency = ['All', ...this.uniqueCurrencies];
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
    console.log(this.selectedChannel);
    this.filterData(); // Re-apply filter with default values
  }

  // Handle individual selection changes
  onSelectionChange(category: string) {
    switch (category) {
      case 'Networks':
        if (this.isAllSelected('All')) {
          this.selectedNetwork = ['All', ...this.uniqueNetworks];
        } else if (
          this.selectedNetwork.filter((item) => item !== 'All').length ===
          this.uniqueNetworks.filter((item) => item !== 'All').length
        ) {
          this.selectedNetwork = ['All', ...this.uniqueNetworks];
        }
        break;
      case 'Channels':
        if (this.isAllSelected('All')) {
          this.selectedChannel = ['All', ...this.uniqueChannels];
        } else if (
          this.selectedChannel.filter((item) => item !== 'All').length ===
          this.uniqueChannels.filter((item) => item !== 'All').length
        ) {
          this.selectedChannel = ['All', ...this.uniqueChannels];
        }
        break;
      case 'Destinations':
        if (this.isAllSelected('All')) {
          this.selectedDestination = ['All', ...this.uniqueDestinations];
        } else if (
          this.selectedDestination.filter((item) => item !== 'All').length ===
          this.uniqueDestinations.filter((item) => item !== 'All').length
        ) {
          this.selectedDestination = ['All', ...this.uniqueDestinations];
        }
        break;
      case 'Currency':
        if (this.isAllSelected('All')) {
          this.selectedCurrency = ['All', ...this.uniqueCurrencies];
        } else if (
          this.selectedCurrency.filter((item) => item !== 'All').length ===
          this.uniqueCurrencies.filter((item) => item !== 'All').length
        ) {
          this.selectedCurrency = ['All', ...this.uniqueCurrencies];
        }
        break;
    }
    console.log(this.selectedNetwork);
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
      case 'currentmonth':
        startDate = moment().subtract(2, 'month').startOf('month'); // Start of the current month
        endDate = moment().subtract(2, 'month').endOf('month'); // End of the current month
        this.days = Array.from({ length: endDate.date() }, (_, i) => i + 1);
        break;
      case 'lastmonth':
        startDate = moment().subtract(3, 'month').startOf('month'); // Start of the previous month
        endDate = moment().subtract(3, 'month').endOf('month'); // End of the previous month
        this.days = Array.from({ length: endDate.date() }, (_, i) => i + 1);
        break;
      case 'lastfourmonth':
        startDate = moment().subtract(3, 'month').startOf('month'); // Start of the previous 3 month
        endDate = moment().endOf('month'); // End of current month
        break;
    }
    // Filtering logic based on selected values
    this.filteredData = this.formattedjson.filter((item) => {
      // Parse item['DateSent'] with the correct format
      const itemDate = moment(item['DateSent'], 'DD/MM/YYYY HH:mm');
      item.FeesInUsd =
        item.FeesInUsd === 'string'
          ? parseFloat(item.FeesInUsd.replace(',', '.'))
          : item.FeesInUsd;
      item.AmountInUSD =
        item.AmountInUSD === 'string'
          ? parseFloat(item.AmountInUSD.replace(',', '.'))
          : item.AmountInUSD;
      return (
        (this.selectedNetwork.includes('All') ||
          this.selectedNetwork.includes(item['Route'])) &&
        (this.selectedChannel.includes('All') ||
          this.selectedChannel.includes(item['InitiationChannel'])) &&
        (this.selectedDestination.includes('All') ||
          this.selectedDestination.includes(item['DestinationCountry'])) &&
        (this.selectedCurrency.includes('All') ||
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
    // Filtering logic based on selected values
    this.filteredWithoutDateData = this.formattedjson.filter((item) => {
      const itemDate = moment(item['DateSent'], 'DD/MM/YYYY HH:mm');
      item.FeesInUsd =
        item.FeesInUsd === 'string'
          ? parseFloat(item.FeesInUsd.replace(',', '.'))
          : item.FeesInUsd;
      item.AmountInUSD =
        item.AmountInUSD === 'string'
          ? parseFloat(item.AmountInUSD.replace(',', '.'))
          : item.AmountInUSD;

      return (
        (this.selectedNetwork.includes('All') ||
          this.selectedNetwork.includes(item['Route'])) &&
        (this.selectedChannel.includes('All') ||
          this.selectedChannel.includes(item['InitiationChannel'])) &&
        (this.selectedDestination.includes('All') ||
          this.selectedDestination.includes(item['DestinationCountry'])) &&
        (this.selectedCurrency.includes('All') ||
          this.selectedCurrency.includes(item['Currency']))
      );
    });

    this.nooftransaction = this.filteredData.filter(
      (x: any) => x['Status'] === 'Completed'
    ).length;

    this.totalusdamount = this.filteredWithoutDateData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => {
        const val =
          b.AmountInUSD === 'string'
            ? parseFloat(b.AmountInUSD.replace(',', '.'))
            : b.AmountInUSD || 0;
        return a + val;
      }, 0);
    this.totalusdFeesInUsd = this.filteredWithoutDateData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => {
        const val =
          b.FeesInUsd === 'string'
            ? parseFloat(b.FeesInUsd.replace(',', '.'))
            : parseFloat(b.FeesInUsd);
        return a + val;
      }, 0);
    console.log(this.totalusdFeesInUsd);
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
    this.processData(this.filteredData, 'snapshot');
    this.processData(this.filteredData, 'time-evolution');
    this.processData(this.filteredData, 'map');
    this.processData(this.filteredData, 'performance');
    this.filterData();
    this.updateChartList();
  }

  get selectedTab(): string {
    return this._selectedTab;
  }

  set selectedTab(value: string) {
    this._selectedTab = value;
    this.filterData();
    // this.processData(this.formattedjson, this._selectedTab); // Call updateChartList whenever selectedTab changes
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
    const d = Math.floor(value * factor) / factor;
    return isNaN(d) ? 0 : Math.floor(value * factor) / factor;
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

    this.totalusdamount = this.filteredWithoutDateData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => {
        const val =
          b.AmountInUSD === 'string'
            ? parseFloat(b.AmountInUSD.replace(',', '.'))
            : b.AmountInUSD || 0;
        return a + val;
      }, 0);
    this.totalusdFeesInUsd = this.filteredWithoutDateData
      .filter((x: any) => x['Status'] === 'Completed')
      .reduce((a, b) => {
        const val =
          b.FeesInUsd === 'string'
            ? parseFloat(b.FeesInUsd.replace(',', '.'))
            : parseFloat(b.FeesInUsd);
        return a + val;
      }, 0);
    this.noofunqiueuser = _.uniqBy(
      this.formattedjson.filter((x) => x['Status'] === 'Completed'),
      'InitiatorId'
    ).length;

    this.processData(this.filteredData, 'snapshot');
    this.processData(this.filteredData, 'time-evolution');
    this.processData(this.filteredData, 'map');
    this.processData(this.filteredData, 'performance');
    this.filterData();
    this.updateChartList();
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
        totalValue: _.sumBy(
          transactions,
          (transaction) => parseFloat(transaction.AmountInUSD) || 0
        ),
        avgValue: _.meanBy(
          transactions,
          (transaction) => parseFloat(transaction.AmountInUSD) || 0
        ),
        users: _.uniqBy(transactions, 'InitiatorId').length,
        feesPaid: _.sumBy(
          transactions,
          (transaction) => parseFloat(transaction.FeesInUsd) || 0
        ),
      }))
      .value();
    console.log(groupedData);
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
            pointFormat: `<b>${chart.formateprefix || ''}{point.y:.1f}${
              chart.formatesuffix || ''
            } </b>`,
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
              categories: this.days,
              // tickPositions: [
              //   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
              //   18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
              // ],
              // endOnTick: false, // Ensures the axis doesn't end on a tick, showing all categories
              labels: {
                formatter: function () {
                  // Assuming `this.value` represents the index within `categories`
                  return (this as any).value + 1; // Displays the day number (1-based index)
                },
              },
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

                  return `${value}${suffix}`;
                },
              },
            },
            tooltip: {
              pointFormat: `<b>${chart.formateprefix || ''}{point.y:.1f}${
                chart.formatesuffix || ''
              } </b>`,
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

                return `${value ? value.toFixed(2) : value}${suffix}`;
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
                      <td style="text-align: left;"> Of Transactions:</td>
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
                  categories: this.days,
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
                  pointFormat: `<b>${chart.formateprefix || ''}{point.y:.1f}${
                    chart.formatesuffix || ''
                  } </b>`,
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
                scrollbar: {
                  enabled: false,
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
                  categories: this.days,
                  labels: {
                    formatter: function () {
                      // Assuming `this.value` represents the index within `categories`
                      return (this as any).value + 1; // Displays the day number (1-based index)
                    },
                  },
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
                series:
                  index === 3
                    ? chart.data
                    : [
                        {
                          name: '',
                          data: chartData, // Example data
                          lineWidth: 1,
                        },
                      ],
                plotOptions:
                  index === 3
                    ? {
                        column: {
                          stacking: 'normal',
                        },
                      }
                    : {},
              };
        }
      ),
    };
  }
}
