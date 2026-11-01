import { ResolveFn } from '@angular/router';
import { DomainUserService } from '../../Services/domain-user.service';
import { inject } from '@angular/core';
import { AuthService } from '../../Services/auth.service';

/**
 * Carrega CAS e cidades (públicos) e, se houver login, os dados do usuário.
 */
export const userResolver: ResolveFn<boolean> = async (route, state) => {
  const userService = inject(DomainUserService);
  const authService = inject(AuthService);

  await authService.authReadyPromise;
  await userService.loadPublicData();

  if (authService.userFirebase()) {
    try {
      await userService.loadUserData();
    } catch {
      // O AuthService já avisou e encerrou a sessão; segue como visitante
    }
  }

  return true;
};
