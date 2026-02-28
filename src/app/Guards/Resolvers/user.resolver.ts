import { ResolveFn } from '@angular/router';
import { DomainUserService } from '../../Services/domain-user.service';
import { inject } from '@angular/core';
import { AuthService } from '../../Services/auth.service';

export const userResolver: ResolveFn<boolean> = async (route, state) => {
  const userService = inject(DomainUserService);
  const authService = inject(AuthService);

  // Aguarda a Promise do serviço (sem RxJS, sem Injector, sem erro)
  await authService.authReadyPromise;

  // Se o usuário está logado mas os dados ainda não subiram, carrega agora
  if (authService.userFirebase() && !userService.domainUser()) {
    await userService.loadUserData();
  }

  return true;
};