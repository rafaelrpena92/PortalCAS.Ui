import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../Models/Contracts/api-response.model';
import { City, Entity } from '../../Models/EntityAggregate/Entities/Entity.model';
import { BaseApiService } from './base.api.service';

@Injectable({
  providedIn: 'root'
})
export class EntityApiService extends BaseApiService {

  GetAllEntities(): Observable<ApiResponse<Entity[]>> {
    return this.http.get<ApiResponse<Entity[]>>(`${this.apiUrl}/Entity/GetAllEntities`);
  }

  GetAllCities(): Observable<ApiResponse<City[]>> {
    return this.http.get<ApiResponse<City[]>>(`${this.apiUrl}/Entity/GetAllCities`);
  }

  SetCityEntity(cityId: number, entityId: string | null): Observable<ApiResponse<void>> {
    const params: any = { cityId };
    if (entityId)
      params.entityId = entityId;

    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Entity/SetCityEntity`, {}, { params });
  }
}
