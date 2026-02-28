import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DomainUserService } from '../../../Services/domain-user.service';
import { Entity } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { NotificationService } from '../../../Services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map-selector',
  imports: [],
  standalone: true,
  templateUrl: './map-selector.component.html',
  styleUrl: './map-selector.component.css'
})
export class MapSelectorComponent {

  private notification = inject(NotificationService);
  router = inject(Router);
  _userService = inject(DomainUserService);

  constructor() { }

  @Output() selectedCas = new EventEmitter<boolean>();
  

  selectedCAS(name: string) {
    const selectedEntity = this.getSelectedEntity(name);

    if(selectedEntity){
      this._userService.setSelectedEntity(selectedEntity);
      this.router.navigate(['/home']);
    }
      

    this.selectedCas.emit(true);
  }

  IsEntityDisabled(name: string): boolean {
    const entities = this._userService.domainUser()?.entities || [];
    const hasAccess = entities.some(e => e.name === name);

    return !hasAccess;
  }

  getSelectedEntity(name: string): Entity  | undefined  {
      const allEntities = this._userService.allEntities();

      const selectedEntity = allEntities.find(x => x.name == name);

    if (!selectedEntity) 
        this.notification.MessagePopup("warning", "Atenção", `Entidade com o nome "${name}" não foi encontrada na lista global.`);

      console.log(selectedEntity);

      return selectedEntity;
  }
}