import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes,  } from './app.routes';
import { authInterceptor } from './Interceptors/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; 
import { MatPaginatorIntl } from '@angular/material/paginator';

export function getPaginatorIntl() {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Itens por página:';
  intl.nextPageLabel = 'Próxima página';
  intl.previousPageLabel = 'Página anterior';
  intl.lastPageLabel = 'Última página';
  intl.firstPageLabel = 'Primeira página';
  return intl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MatPaginatorIntl, useFactory: getPaginatorIntl },
    provideAnimationsAsync()
  ]
};
