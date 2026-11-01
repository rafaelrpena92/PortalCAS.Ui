import { Component, computed, inject, Inject, signal, ViewEncapsulation} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
  MatDialogTitle,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIcon } from "@angular/material/icon";
import { NotificationService } from '../../../../Services/notification.service';
import { UserService } from '../../../../Services/user.service';
import { DomainUserService } from '../../../../Services/domain-user.service';
import { User } from '../../../../Models/UserAggregate/Entities/user.model';
import { Entity, EntityRole, EntityRoleItem } from '../../../../Models/EntityAggregate/Entities/Entity.model';
import { ClaimType } from '../../../../Models/UserAggregate/Enums/ClaimType.enum';
import { ComboboxComponent, ComboboxOption } from '../../../Shared/combobox/combobox.component';
import { casColor } from '../../../../Utils/cas-colors.util';

interface RoleRow {
  entity: Entity;
  role: EntityRole | null;
  original: EntityRole | null;
  /** Administrador do CAS não define (nem tira) administradores do CAS */
  locked: boolean;
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    MatDialogClose,
    MatSlideToggleModule,
    MatIcon,
    ComboboxComponent
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditUserDialogComponent {
  _notification = inject(NotificationService);
  _userService = inject(UserService);
  _domainUser = inject(DomainUserService);

  EntityRole = EntityRole;
  casColor = casColor;

  user: User;
  isActive = signal(true);
  isAdminGeral = signal(false);
  rows = signal<RoleRow[]>([]);
  isLoading = signal(false);

  canEditAdminGeral = computed(() => this._domainUser.isAdminGeral());
  isSelf = computed(() => this._domainUser.domainUser()?.id === this.user.userId);

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, entityId: string | null }
  ) {
    this.user = data.user;
    this.isActive.set(this.user.isActive);
    this.isAdminGeral.set(this.user.claimType === ClaimType.AdminGeral);
    this.rows.set(this.buildRows());
  }

  initials() {
    const base = (this.user.name || this.user.email).trim();
    const parts = base.split(/[\s@.]+/).filter(p => p);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  /** Só o administrador geral define administradores do CAS. */
  roleOptions(row: RoleRow): ComboboxOption[] {
    const options: ComboboxOption[] = [
      { value: '', label: 'Sem acesso', color: '#d4d8de' },
      { value: '' + EntityRole.Avaliador, label: 'Avaliador', color: '#7c3aed' }
    ];
    if (this.canEditAdminGeral() || row.locked)
      options.push({ value: '' + EntityRole.AdminCas, label: 'Administrador do CAS', color: '#e6b800' });
    return options;
  }

  setRole(row: RoleRow, value: string) {
    row.role = value ? Number(value) as EntityRole : null;
    this.rows.set([...this.rows()]);
  }

  async Save() {
    const changedRoles: EntityRoleItem[] = this.rows()
      .filter(r => r.role !== r.original)
      .map(r => ({ entityId: r.entity.entityId, role: r.role }));

    try {
      this.isLoading.set(true);
      await this._userService.SaveUser({
        userId: this.user.userId,
        isActive: this.isActive(),
        isAdminGeral: this.canEditAdminGeral() ? this.isAdminGeral() : null,
        roles: changedRoles
      });
      this._notification.smallMessagePopup("success", "Usuário salvo com sucesso!", () => { }, 1000);
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error(error);
      this._notification.MessagePopup("error", "Erro", error?.error?.message ?? "Não foi possível salvar as alterações.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Administrador geral vê todos os CAS; administrador do CAS só os que administra. */
  private buildRows(): RoleRow[] {
    const isAdminGeral = this._domainUser.isAdminGeral();
    const entities = this._domainUser.allEntities()
      .filter(e => isAdminGeral || this._domainUser.roleIn(e.entityId) === EntityRole.AdminCas);

    return entities.map(entity => {
      const original = this.user.roles.find(r => r.entityId === entity.entityId)?.role ?? null;
      return { entity, role: original, original, locked: !isAdminGeral && original === EntityRole.AdminCas };
    });
  }
}
