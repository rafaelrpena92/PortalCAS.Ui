import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../Models/Contracts/api-response.model';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMe(): Observable<ApiResponse<string>> { 
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/user/me`);
  }
}