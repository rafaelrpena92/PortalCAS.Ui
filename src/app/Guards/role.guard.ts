import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClaimType } from '../Models/UserAggregate/Enums/ClaimType.enum';
import { DomainUserService } from '../Services/domain-user.service';
import { AuthService } from '../Services/auth.service';

export const roleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const _authService = inject(AuthService);
  const _userService = inject(DomainUserService);
  const expectedClaim = route.data['expectedClaim'] as ClaimType;

  await _authService.authReadyPromise;

  if (!_authService.userFirebase()) {
    return false;
  }

  if (!_userService.domainUser()) {
    try {
      await _userService.loadUserData();
    } catch (error) {
      console.error("Erro ao carregar dados do usuário no Guard", error);
      router.navigate(['/login']);
      return false;
    }
  }

  if (_userService.isAdmin()) {
    return true;
  }

  if (expectedClaim === ClaimType.User && _userService.isUser()) {
    return true;
  }

  console.warn("Acesso negado à rota:", state.url);
  router.navigate(['/home']);
  return false;
};