import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';

@Component({
  selector: 'app-content',
  imports: [
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,   
    MatSidenavModule, 
    MatListModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  constructor(private router: Router) { }

  isMenuOpen = true; 
  
  Logout() {
    this.router.navigate(['/login']);
  }
}
