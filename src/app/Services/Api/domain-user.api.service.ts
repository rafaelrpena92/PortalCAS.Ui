import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../Models/Contracts/api-response.model';
import { DomainUser } from '../../Models/UserAggregate/Entities/domain-user.model';
import { BaseApiService } from './base.api.service';

@Injectable({
  providedIn: 'root'
})
export class DomainUserApiService extends BaseApiService{

  GetMe(): Observable<ApiResponse<DomainUser>> {
    return this.http.get<ApiResponse<DomainUser>>(`${this.apiUrl}/DomainUser/GetMe`);
  }
}