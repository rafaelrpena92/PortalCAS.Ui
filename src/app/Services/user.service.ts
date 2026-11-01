import { inject, Injectable } from '@angular/core';
import { PagerRequest } from '../Models/Contracts/pagerRequest.model';
import { UserApiService } from './Api/user.api.service';
import { PagerResult } from '../Models/Contracts/pagerResult.model';
import { SaveUser, User } from '../Models/UserAggregate/Entities/user.model';
import { firstValueFrom, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _userApiService = inject(UserApiService);

  constructor() { }

  searchUsers(request: PagerRequest, filter: string, entityId?: string | null): Observable<PagerResult<User>> {
    return this._userApiService.SearchUsers(request, filter, entityId);
  }

  async SaveUser(user: SaveUser) {
    await firstValueFrom(this._userApiService.SaveUser(user));
  }
}
