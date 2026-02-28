import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

export const guestGuard: CanActivateFn = async (route, state) => {

    const _authService = inject(AuthService);
    const router = inject(Router);

    await _authService.authReadyPromise; // Aguarda o Firebase inicializar

    if (_authService.userFirebase()) {
        router.navigate(['/home']);
        return false;
    }

    return true
};