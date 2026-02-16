import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';

@Component({
  selector: 'app-content',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterOutlet,
    RouterLink, 
    RouterLinkActive
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  constructor(private router: Router, public authService: AuthService) { }

  isMenuOpen = true;


  async Logout() {
    try {
      await this.authService.logout();

      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
    }
  }

  goToUserConfig(){
    this.router.navigate(['/userConfiguration']);
  }

  goToConfiguration(){
    this.router.navigate(['/configuration']);
  }

  goToWelcome(){
    this.router.navigate(['/welcome']);
  }
}
