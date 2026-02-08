import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Login/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: DashboardComponent },
    { path: '**', redirectTo: '' }
];