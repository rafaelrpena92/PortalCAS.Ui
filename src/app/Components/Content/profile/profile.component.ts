import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomainUserService } from '../../../Services/domain-user.service';
import { NotificationService } from '../../../Services/notification.service';
import { City, EntityRoleLabel } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { CityPickerComponent } from '../../Shared/city-picker/city-picker.component';

/**
 * Meus dados: nome e cidade. A cidade define o CAS de residência.
 */
@Component({
  selector: 'app-profile',
  imports: [FormsModule, MatButtonModule, MatIconModule, CityPickerComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  _userService = inject(DomainUserService);
  private notification = inject(NotificationService);

  roleLabel = EntityRoleLabel;

  name = signal(this._userService.domainUser()?.name ?? '');
  city = signal<City | null>(this._userService.domainUser()?.city ?? null);
  understood = signal(false);
  isSaving = signal(false);

  currentEntityId = computed(() => this._userService.domainUser()?.residenceEntity?.entityId ?? null);

  /** Mudar para cidade de outro CAS: avisa que as inscrições do CAS atual serão canceladas. */
  changesCas = computed(() => {
    const current = this.currentEntityId();
    const next = this.city()?.entityId ?? null;
    return !!current && current !== next;
  });

  canSave = computed(() => !this.isSaving() && !!this.city() && (!this.changesCas() || this.understood()));

  onCity(city: City | null) {
    this.city.set(city);
    this.understood.set(false);
  }

  async save() {
    if (!this.canSave()) return;

    this.isSaving.set(true);
    try {
      await this._userService.updateProfile({ name: this.name(), cityId: this.city()?.id ?? null });
      this.notification.smallMessagePopup('success', 'Dados salvos!');
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível salvar.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
