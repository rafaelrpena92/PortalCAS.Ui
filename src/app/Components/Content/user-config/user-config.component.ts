import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { finalize } from 'rxjs';
import { UserService } from '../../../Services/user.service';
import { DomainUserService } from '../../../Services/domain-user.service';
import { PagerRequest } from '../../../Models/Contracts/pagerRequest.model';
import { PagerResult } from '../../../Models/Contracts/pagerResult.model';
import { User } from '../../../Models/UserAggregate/Entities/user.model';
import { EntityRole, EntityRoleLabel } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { ClaimType } from '../../../Models/UserAggregate/Enums/ClaimType.enum';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { ComboboxComponent, ComboboxOption } from '../../Shared/combobox/combobox.component';
import { casColor } from '../../../Utils/cas-colors.util';

/**
 * Usuários do CAS (administrador do CAS) ou de todos os CAS (administrador geral).
 * Clicar no usuário abre o detalhe em popup; no celular, em tela cheia.
 */
@Component({
  selector: 'app-user-config',
  imports: [MatButtonModule, MatIcon, FormsModule, CommonModule, ComboboxComponent],
  templateUrl: './user-config.component.html',
  styleUrl: './user-config.component.css'
})
export class UserConfigComponent {
  private dialog = inject(MatDialog);
  private breakpoint = inject(BreakpointObserver);
  _userService = inject(UserService);
  _domainUser = inject(DomainUserService);

  roleLabel = EntityRoleLabel;

  pages: number[] = [];
  isLoading = false;
  filter = '';
  pagerResponse: PagerResult<User> | null = null;
  pagerRequest: PagerRequest = { pageNumber: 1, pageSize: 10 };

  /** '' = todos os CAS (só administrador geral) */
  entityFilter = signal<string>(this.defaultEntity());

  /** CAS que o usuário pode administrar. */
  adminEntities = computed(() => this._domainUser.isAdminGeral()
    ? this._domainUser.allEntities()
    : this._domainUser.allEntities().filter(e => this._domainUser.roleIn(e.entityId) === EntityRole.AdminCas));

  /** Opções do filtro de CAS ("Todos os CAS" só para o administrador geral). */
  entityOptions = computed<ComboboxOption[]>(() => [
    ...(this._domainUser.isAdminGeral() ? [{ value: '', label: 'Todos os CAS' }] : []),
    ...this.adminEntities().map(e => ({ value: e.entityId, label: e.name, color: casColor(e.name) }))
  ]);

  constructor() {
    this.search();
  }

  search() {
    this.pagerRequest.pageNumber = 1;
    this.searchUsers();
  }

  searchUsers() {
    this.isLoading = true;
    this._userService.searchUsers(this.pagerRequest, this.filter, this.entityFilter() || null)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.pagerResponse = res;
          const total = Math.ceil((res?.totalRows || 0) / this.pagerRequest.pageSize);
          this.pages = Array.from({ length: total }, (_, i) => i + 1);
        },
        error: (err) => {
          console.error(err);
          this.pagerResponse = null;
          this.pages = [];
        }
      });
  }

  changeEntity(entityId: string) {
    this.entityFilter.set(entityId);
    this.search();
  }

  openUser(user: User) {
    const isMobile = this.breakpoint.isMatched('(max-width: 600px)');
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: isMobile ? '100vw' : '520px',
      maxWidth: isMobile ? '100vw' : '520px',
      height: isMobile ? '100vh' : undefined,
      panelClass: isMobile ? 'dialog-fullscreen' : undefined,
      data: { user, entityId: this.entityFilter() || null }
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved)
        this.searchUsers();
    });
  }

  changePage(pagina: number) {
    this.pagerRequest.pageNumber = pagina;
    this.searchUsers();
  }

  isAdminGeral(user: User) {
    return user.claimType === ClaimType.AdminGeral;
  }

  initials(user: User) {
    const base = (user.name || user.email).trim();
    const parts = base.split(/[\s@.]+/).filter(p => p);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  private defaultEntity(): string {
    // Administrador do CAS começa no CAS selecionado; administrador geral vê todos
    return this._domainUser.isAdminGeral() ? '' : (this._domainUser.selectedEntity()?.entityId ?? '');
  }
}
