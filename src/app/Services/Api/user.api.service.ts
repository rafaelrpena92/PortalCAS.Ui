import { Injectable } from "@angular/core";
import { BaseApiService } from "./base.api.service";
import { PagerRequest } from "../../Models/Contracts/pagerRequest.model";
import { map, Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { PagerResult } from "../../Models/Contracts/pagerResult.model";
import { ApiResponse } from "../../Models/Contracts/api-response.model";
import { User } from "../../Models/UserAggregate/Entities/user.model";


@Injectable({
  providedIn: 'root'
})
export class UserApiService extends BaseApiService {

  SearchUsers(request: PagerRequest, filter : string): Observable<PagerResult<User>> {

    const params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString())
      .set('filter', filter);

    return this.http.get<ApiResponse<PagerResult<User>>>(`${this.apiUrl}/User/SearchUserByFilter`, { params })
      .pipe(map(response => response.data));
  }
}
