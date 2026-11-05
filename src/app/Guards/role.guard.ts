import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DomainUserService } from '../Services/domain-user.service';
import { AuthService } from '../Services/auth.service';
import { EntityRole } from '../Models/EntityAggregate/Entities/Entity.model';

/** Perfis que uma rota pode exigir em data.expectedRole. */
export type ExpectedRole = 'adminGeral' | 'adminCas' | 'avaliador';

/**
 * Só confere o acesso à tela. A API valida de novo em cada operação.
 */
export const roleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const _authService = inject(AuthService);
  const _userService = inject(DomainUserService);
  const expectedRole = route.data['expectedRole'] as ExpectedRole;

  await _authService.authReadyPromise;

  if (!_authService.userFirebase()) {
    router.navigate(['/login']);
    return false;
  }

  try {
    await _userService.loadUserData();
  } catch (error) {
    console.error("Erro ao carregar dados do usuário no Guard", error);
    router.navigate(['/login']);
    return false;
  }

  const isAdminGeral = _userService.isAdminGeral();
  const roles = _userService.domainUser()?.roles ?? [];
  const isAdminCas = isAdminGeral || roles.some(r => r.role === EntityRole.AdminCas);
  const isAvaliador = isAdminGeral || roles.some(r => !!r.role);

  if ((expectedRole === 'adminGeral' && isAdminGeral) || (expectedRole === 'adminCas' && isAdminCas) || (expectedRole === 'avaliador' && isAvaliador))
    return true;

  console.warn("Acesso negado à rota:", state.url);
  router.navigate(['/']);
  return false;
};
