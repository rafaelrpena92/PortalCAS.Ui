import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClaimType } from '../Models/UserAggregate/Enums/ClaimType.enum';
import { DomainUserService } from '../Services/domain-user.service';

export const roleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const _userService = inject(DomainUserService);
  const expectedClaim = route.data['expectedClaim'] as ClaimType;

  if (_userService.isAdmin())
    return true;

  if (expectedClaim === ClaimType.User && _userService.isUser())
    return true;

  console.warn("Acesso negado à rota:", state.url);
  router.navigate(['/home']);
  return false;
};