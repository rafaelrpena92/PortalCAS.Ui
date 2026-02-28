import { inject, Injectable } from '@angular/core';
import { PagerRequest } from '../Models/Contracts/pagerRequest.model';
import { UserApiService } from './Api/user.api.service';
import { PagerResult } from '../Models/Contracts/pagerResult.model';
import { User } from '../Models/UserAggregate/Entities/user.model';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _userApiService = inject(UserApiService);

  //  result: PagerResult<User> = {
  //   items: [],
  //   totalRows: 0,
  //   pageNumber: 1
  // };


  constructor() { }

  searchUsers(request: PagerRequest, email: string): Observable<any> {
    return this._userApiService.SearchUsers(request, email);
  }
}
