import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Login/login/login.component';
import { DashboardComponent } from './Components/Login/dashboard/dashboard.component';
import { authGuard } from './Guards/auth.guard';
import { guestGuard } from './Guards/guest.guard';


export const routes: Routes = [
     { 
        path: '', 
        component: LoginComponent, 
        canActivate: [guestGuard] 
    },
    { 
        path: 'login', 
        component: LoginComponent, 
        canActivate: [guestGuard] 
    },
    {
        path: 'home',
        component: DashboardComponent,
        canActivate: [authGuard]
    },


    { path: '**', redirectTo: '' }
];