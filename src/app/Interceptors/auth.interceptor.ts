import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const _authService = inject(AuthService);
    const token = _authService.getToken();

    //Intercepta todas as requisições e passa o token no header
    if (token && req.url.startsWith(environment.apiUrl)) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }


    return next(req);
};