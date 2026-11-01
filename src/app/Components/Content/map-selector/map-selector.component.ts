import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DomainUserService } from '../../../Services/domain-user.service';
import { Entity, EntityRole } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { NotificationService } from '../../../Services/notification.service';

/** Cores das regiões do mapa, usadas também nas bolinhas da lista. */
const REGION_COLORS: Record<string, string> = {
  'CAS Cascavel': '#dd68a9',
  'CAS Umuarama': '#E2686C',
  'CAS Maringá': '#F8ACAE',
  'CAS Apucarana': '#0C6682',
  'CAS Francisco Beltrão': '#A62629',
  'CAS Guarapuava': '#FF5254',
  'CAS Curitiba': '#5CACC4'
};

@Component({
  selector: 'app-map-selector',
  imports: [],
  standalone: true,
  templateUrl: './map-selector.component.html',
  styleUrl: './map-selector.component.css'
})
export class MapSelectorComponent {

  private notification = inject(NotificationService);
  _userService = inject(DomainUserService);

  @Output() selectedCas = new EventEmitter<boolean>();

  /** O mapa usa o nome do CAS como chave (ex.: "CAS Guarapuava"). */
  async selectedCAS(name: string) {
    const entity = this.getEntity(name);
    if (!entity) {
      this.notification.MessagePopup("warning", "Atenção", `O ${name} ainda não está cadastrado.`);
      return;
    }

    if (!this._userService.canSelectEntity(entity.entityId))
      return;

    await this._userService.setSelectedEntity(entity);
    this.selectedCas.emit(true);
  }

  IsEntityDisabled(name: string): boolean {
    const entity = this.getEntity(name);
    return !entity || !this._userService.canSelectEntity(entity.entityId);
  }

  isSelected(entity: Entity): boolean {
    return this._userService.selectedEntity()?.entityId === entity.entityId;
  }

  color(entity: Entity): string {
    return REGION_COLORS[entity.name] ?? '#8a919c';
  }

  /** Etiqueta da lista: "Seu CAS", papel no CAS ou "Sem acesso". */
  tag(entity: Entity): string | null {
    if (!this._userService.canSelectEntity(entity.entityId)) return 'Sem acesso';
    const role = this._userService.roleIn(entity.entityId);
    if (role === EntityRole.AdminCas) return 'Você administra';
    if (role === EntityRole.Avaliador) return 'Você avalia';
    if (this._userService.isResidence(entity.entityId)) return 'Seu CAS';
    return null;
  }

  private getEntity(name: string): Entity | undefined {
    return this._userService.allEntities().find(x => x.name == name);
  }
}
