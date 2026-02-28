import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../Models/Contracts/api-response.model';
import { Entity } from '../../Models/EntityAggregate/Entities/Entity.model';
import { BaseApiService } from './base.api.service';

@Injectable({
  providedIn: 'root'
})
export class EntityApiService extends BaseApiService {

  SetLastSelectedEntity(userId: string, entityId: string): Observable<ApiResponse<void>> {
    const params = { userId, entityId };
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/entity/SetLastSelectedEntity`,
      {},
      { params: params }
    );
  }

  GetAllEntities(): Observable<ApiResponse<Entity[]>> {
    return this.http.get<ApiResponse<Entity[]>>(`${this.apiUrl}/entity/GetAllEntities`);
  }
}