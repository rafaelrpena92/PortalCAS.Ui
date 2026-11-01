import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomainUserService } from '../../../Services/domain-user.service';
import { City } from '../../../Models/EntityAggregate/Entities/Entity.model';
import { CityPickerComponent } from '../../Shared/city-picker/city-picker.component';

/**
 * Início público. As notícias e bancas entram na fase 2; por enquanto mostra o CAS
 * selecionado, como funciona e o "Localize o seu CAS".
 */
@Component({
  selector: 'app-welcome',
  imports: [RouterLink, MatIconModule, CityPickerComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  _userService = inject(DomainUserService);

  foundCity = signal<City | null>(null);

  async goToCas(city: City) {
    const entity = this._userService.allEntities().find(e => e.entityId === city.entityId);
    if (entity)
      await this._userService.setSelectedEntity(entity);
  }
}
