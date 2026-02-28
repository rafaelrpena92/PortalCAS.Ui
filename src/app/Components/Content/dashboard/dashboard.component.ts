import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../Services/auth.service';
import { MapSelectorComponent } from '../map-selector/map-selector.component';
import { trigger, style, animate, transition } from '@angular/animations';
import { DomainUserService } from '../../../Services/domain-user.service';
import { Entity } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { MatExpansionModule } from '@angular/material/expansion';

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
    RouterLinkActive,
    MapSelectorComponent,
    MatExpansionModule
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  private router = inject(Router);
  _userService = inject(DomainUserService);
  _authService = inject(AuthService);
  isMapOpen = false;
  entity: Entity = new Entity();

  constructor() { }

  ngOnInit(): void {

  }

  async Logout() {
    try {
      await this._authService.logout();

      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
    }
  }

  toggleMap() {
    this.isMapOpen = !this.isMapOpen;
  }
}
