// multi-select-dropdown.component.ts
import { Component, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatIconModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state(
        'closed',
        style({
          opacity: 0,
          transform: 'translateY(-10px)',
        })
      ),
      state(
        'open',
        style({
          opacity: 1,
          transform: 'translateY(0)',
        })
      ),
      transition('closed => open', [animate('300ms ease-out')]),
      transition('open => closed', [animate('200ms ease-in')]),
    ]),
  ],
})
export class DropdownComponent {
  options = [
    { name: 'All', selected: true },
    { name: 'TerraPay', selected: true },
    { name: 'Swift', selected: true },
    { name: 'Thunes', selected: true },
    { name: 'Visa Direct', selected: true },
  ];

  dropdownOpen = false; // Track if the dropdown is open

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleSelection(option: any) {
    option.selected = !option.selected;
  }

  // Close the dropdown if clicked outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.dropdown-container')) {
      this.dropdownOpen = false;
    }
  }
}
