import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../Models/Contracts/api-response.model';
import { DomainUser } from '../../Models/Entities/User/DomainUser.model';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  GetMe(): Observable<ApiResponse<DomainUser>> {
    return this.http.get<ApiResponse<DomainUser>>(`${this.apiUrl}/user/me`);
  }
}