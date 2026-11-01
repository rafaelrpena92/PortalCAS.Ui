import { Component, computed, inject, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../Services/auth.service';
import { MapSelectorComponent } from '../map-selector/map-selector.component';
import { trigger, style, animate, transition } from '@angular/animations';
import { DomainUserService } from '../../../Services/domain-user.service';

interface MenuItem {
  label: string;
  icon: string;
  link: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

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
    MapSelectorComponent
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

  @ViewChild('sidenav') sidenav?: MatSidenav;

  /** No celular o menu vira gaveta por cima do conteúdo. */
  isMobile = toSignal(
    inject(BreakpointObserver).observe('(max-width: 900px)').pipe(map(r => r.matches)),
    { initialValue: false });

  /** Menu lateral conforme o perfil e o CAS selecionado. */
  menu = computed<MenuSection[]>(() => {
    const user = this._userService;
    const sections: MenuSection[] = [{
      items: [
        { label: 'Início', icon: 'home', link: '/' },
        { label: 'Bancas', icon: 'event', link: '/bancas' },
        { label: 'Validar certificado', icon: 'verified', link: '/validar-certificado' }
      ]
    }];

    if (user.isLoggedIn()) {
      sections.push({
        title: 'MINHA ÁREA',
        items: [{ label: 'Meus dados', icon: 'person', link: '/meus-dados' }]
      });
    }

    const admin: MenuItem[] = [];
    if (user.isAdminCasInSelected())
      admin.push({ label: 'Usuários', icon: 'group', link: '/usuarios' });
    if (user.isAdminGeral())
      admin.push({ label: 'Cidades e CAS', icon: 'location_city', link: '/cidades' });
    if (admin.length)
      sections.push({ title: user.isAdminGeral() ? 'ADMINISTRAÇÃO' : 'ADMINISTRAÇÃO DO CAS', items: admin });

    return sections;
  });

  constructor() {
    this._userService.loadPublicData();

    // Fecha a gaveta ao navegar no celular
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobile())
        this.sidenav?.close();
    });
  }

  async Logout() {
    try {
      await this._authService.logout();

      this.router.navigate(['/']);
    } catch (error) {
      console.error(error);
    }
  }

  toggleMap() {
    this.isMapOpen = !this.isMapOpen;
  }
}
