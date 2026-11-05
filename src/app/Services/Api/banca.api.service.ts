import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../Models/Contracts/api-response.model';
import { Banca, BancaSummary, News, SaveBanca } from '../../Models/BancaAggregate/banca.model';
import { BaseApiService } from './base.api.service';

@Injectable({
  providedIn: 'root'
})
export class BancaApiService extends BaseApiService {

  GetPublicBancas(entityId: string): Observable<ApiResponse<BancaSummary[]>> {
    return this.http.get<ApiResponse<BancaSummary[]>>(`${this.apiUrl}/Banca/GetPublicBancas`, { params: { entityId } });
  }

  GetManagedBancas(entityId: string): Observable<ApiResponse<BancaSummary[]>> {
    return this.http.get<ApiResponse<BancaSummary[]>>(`${this.apiUrl}/Banca/GetManagedBancas`, { params: { entityId } });
  }

  GetBanca(id: string): Observable<ApiResponse<Banca>> {
    return this.http.get<ApiResponse<Banca>>(`${this.apiUrl}/Banca/GetBanca`, { params: { id } });
  }

  SaveBanca(banca: SaveBanca): Observable<ApiResponse<Banca>> {
    return this.http.post<ApiResponse<Banca>>(`${this.apiUrl}/Banca/SaveBanca`, banca);
  }

  Activate(id: string): Observable<ApiResponse<Banca>> {
    return this.http.post<ApiResponse<Banca>>(`${this.apiUrl}/Banca/Activate`, {}, { params: { id } });
  }

  Cancel(id: string, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Banca/Cancel`, { reason }, { params: { id } });
  }

  Delete(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Banca/Delete`, {}, { params: { id } });
  }

  UploadEdital(id: string, file: File): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Banca/UploadEdital`, form, { params: { id } });
  }

  /** Link direto para baixar o edital (público para bancas publicadas). */
  EditalUrl(id: string): string {
    return `${this.apiUrl}/Banca/GetEdital?id=${id}`;
  }

  UploadImage(id: string, file: File): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Banca/UploadImage`, form, { params: { id } });
  }

  RemoveImage(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Banca/RemoveImage`, {}, { params: { id } });
  }

  /** Arte pela requisição autenticada (rascunho só abre para avaliadores). */
  GetImageBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/Banca/GetImage`, { params: { id }, responseType: 'blob' });
  }

  /** Link público da arte (bancas publicadas). A versão evita mostrar a arte antiga do cache. */
  ImageUrl(id: string, version?: string | null): string {
    return `${this.apiUrl}/Banca/GetImage?id=${id}${version ? '&v=' + version : ''}`;
  }

  GetPublicNews(entityId: string, take = 6): Observable<ApiResponse<News[]>> {
    return this.http.get<ApiResponse<News[]>>(`${this.apiUrl}/News/GetPublicNews`, { params: { entityId, take } });
  }
}
