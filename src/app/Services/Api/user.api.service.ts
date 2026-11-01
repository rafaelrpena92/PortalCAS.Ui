import { Injectable } from "@angular/core";
import { BaseApiService } from "./base.api.service";
import { PagerRequest } from "../../Models/Contracts/pagerRequest.model";
import { map, Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { PagerResult } from "../../Models/Contracts/pagerResult.model";
import { ApiResponse } from "../../Models/Contracts/api-response.model";
import { SaveUser, User } from "../../Models/UserAggregate/Entities/user.model";

@Injectable({
  providedIn: 'root'
})
export class UserApiService extends BaseApiService {

  /** Sem entityId: todos (só administrador geral). Com entityId: usuários daquele CAS. */
  SearchUsers(request: PagerRequest, filter: string, entityId?: string | null): Observable<PagerResult<User>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString())
      .set('filter', filter);

    if (entityId)
      params = params.set('entityId', entityId);

    return this.http.get<ApiResponse<PagerResult<User>>>(`${this.apiUrl}/User/SearchUserByFilter`, { params })
      .pipe(map(response => response.data));
  }

  SaveUser(user: SaveUser): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/User/SaveUser`, user);
  }
}
