import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseApiService {

  protected http = inject(HttpClient);
  protected apiUrl = environment.apiUrl;

  protected buildUrl(path: string): string {
    const sanitizedPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.apiUrl}/${sanitizedPath}`;
  }

  protected getWithParams<T>(path: string, paramsObj: any): Observable<T> {
    let params = new HttpParams();
    if (paramsObj) {
      Object.keys(paramsObj).forEach(key => {
        if (paramsObj[key] !== undefined && paramsObj[key] !== null) {
          params = params.set(key, paramsObj[key]);
        }
      });
    }
    return this.http.get<T>(this.buildUrl(path), { params });
  }
}