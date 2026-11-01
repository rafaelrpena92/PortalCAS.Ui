import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EntityApiService } from './Api/entity.api.service';
import { DomainUserService } from './domain-user.service';

@Injectable({
  providedIn: 'root'
})
export class EntityService {

  private _entityApiService = inject(EntityApiService);
  private _userService = inject(DomainUserService);

  /** Liga a cidade ao CAS (ou desliga, com null) e atualiza a lista em memória. */
  async setCityEntity(cityId: number, entityId: string | null) {
    await firstValueFrom(this._entityApiService.SetCityEntity(cityId, entityId));

    const entityName = this._userService.allEntities().find(e => e.entityId === entityId)?.name ?? null;
    this._userService.cities.update(list =>
      list.map(c => c.id === cityId ? { ...c, entityId, entityName } : c));
  }
}
