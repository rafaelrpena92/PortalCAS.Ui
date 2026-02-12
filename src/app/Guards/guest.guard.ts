import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../Services/auth.service'; // Importe seu serviço

export const guestGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    
    const authService = inject(AuthService); 
    
    const auth = getAuth();

    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                console.log("Usuário já logado, redirecionando para home...");
                router.navigate(['/home']);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};