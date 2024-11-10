// header.component.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DropdownComponent } from '../../ui/component/dropdown/dropdown.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    DropdownComponent,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  userName: string = 'Elvin Bond';
  userInitials: string = 'EB';
  toppings = new FormControl('');
  isMenuOpen = false; // Track the menu state

  @ViewChild(MatMenuTrigger, { static: false }) menuTrigger:
    | MatMenuTrigger
    | any;

  // Method to toggle the menu state
  toggleMenu() {
    if (this.isMenuOpen) {
      this.menuTrigger.closeMenu();
    } else {
      this.menuTrigger.openMenu();
    }
  }

  onMenuOpened() {
    this.isMenuOpen = true;
  }

  onMenuClosed() {
    this.isMenuOpen = false;
  }
  toppingList: string[] = [
    'Extra cheese',
    'Mushroom',
    'Onion',
    'Pepperoni',
    'Sausage',
    'Tomato',
  ];
  ngAfterViewInit() {
    if (!this.menuTrigger) {
      console.error('Menu trigger is not available');
    }
  }
}
