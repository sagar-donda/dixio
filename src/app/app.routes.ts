import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './sections/dashboard/dashboard.component'; // Import the DashboardComponent
import { NgModule } from '@angular/core';
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // Redirect to the dashboard by default
  { path: 'dashboard', component: DashboardComponent }, // Load the DashboardComponent for the /dashboard route
  { path: '**', redirectTo: '/dashboard' }, // Redirect any unknown routes to the dashboard
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // Enable hash-based routing
  exports: [RouterModule],
})
export class AppRoutingModule {}
