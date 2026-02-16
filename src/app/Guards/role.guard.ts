import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { ClaimType } from '../Models/Entities/User/ClaimType.enum';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedClaim = route.data['expectedClaim'] as ClaimType;

  if (authService.isAdmin()) {
    return true;
  }

  if (expectedClaim === ClaimType.User && authService.isUser()) {
    return true;
  }

  console.warn("Acesso negado à rota:", state.url);
  router.navigate(['/home']);
  return false;
};