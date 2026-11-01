import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DomainUserService } from '../../../Services/domain-user.service';
import { EntityService } from '../../../Services/entity.service';
import { NotificationService } from '../../../Services/notification.service';
import { City } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { ComboboxComponent, ComboboxOption } from '../../Shared/combobox/combobox.component';
import { casColor } from '../../../Utils/cas-colors.util';

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Administrador geral liga cada município do Paraná a um CAS.
 */
@Component({
  selector: 'app-cities-config',
  imports: [FormsModule, MatIconModule, ComboboxComponent],
  templateUrl: './cities-config.component.html',
  styleUrl: './cities-config.component.css'
})
export class CitiesConfigComponent {
  _userService = inject(DomainUserService);
  private _entityService = inject(EntityService);
  private notification = inject(NotificationService);

  casColor = casColor;

  search = signal('');
  /** 'todas', 'sem' (sem CAS) ou o entityId */
  casFilter = signal('todas');
  savingId = signal<number | null>(null);

  withoutCas = computed(() => this._userService.cities().filter(c => !c.entityId).length);

  /** Opções do CAS de cada cidade. */
  casOptions = computed<ComboboxOption[]>(() => [
    { value: '', label: 'Sem CAS', color: '#d4d8de' },
    ...this._userService.allEntities().map(e => ({
      value: e.entityId,
      label: e.name,
      color: casColor(e.name),
      hint: `${this.countFor(e.entityId)} cidades`
    }))
  ]);

  filterOptions = computed<ComboboxOption[]>(() => [
    { value: 'todas', label: 'Todos os CAS' },
    { value: 'sem', label: 'Sem CAS', color: '#d4d8de', hint: `${this.withoutCas()}` },
    ...this._userService.allEntities().map(e => ({
      value: e.entityId, label: e.name, color: casColor(e.name), hint: `${this.countFor(e.entityId)}`
    }))
  ]);

  list = computed(() => {
    const term = normalize(this.search());
    const filter = this.casFilter();
    return this._userService.cities().filter(c =>
      (!term || normalize(c.name).includes(term)) &&
      (filter === 'todas' || (filter === 'sem' ? !c.entityId : c.entityId === filter)));
  });

  async change(city: City, entityId: string | null) {
    this.savingId.set(city.id);
    try {
      await this._entityService.setCityEntity(city.id, entityId);
    } catch (error: any) {
      this.notification.MessagePopup('error', 'Erro', error?.error?.message ?? 'Não foi possível salvar.');
    } finally {
      this.savingId.set(null);
    }
  }

  private countFor(entityId: string) {
    return this._userService.cities().filter(c => c.entityId === entityId).length;
  }
}
