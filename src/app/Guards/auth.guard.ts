import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {

    const _authService = inject(AuthService);
    const router = inject(Router);

    await _authService.authReadyPromise; // Aguarda o Firebase inicializar

    if (_authService.userFirebase()) {
        return true;
    }

    //SE NAO TIVER ACESSO VAI PARA O LOGIN
    router.navigate(['/login']);
    return false;
};