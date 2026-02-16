import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Login/login/login.component';
import { DashboardComponent } from './Components/Content/dashboard/dashboard.component';
import { authGuard } from './Guards/auth.guard';
import { guestGuard } from './Guards/guest.guard';
import { UserConfigComponent } from './Components/Content/user-config/user-config.component';
import { roleGuard } from './Guards/role.guard';
import { WelcomeComponent } from './Components/Content/welcome/welcome.component';
import { ClaimType } from './Models/Entities/User/ClaimType.enum';
import { ConfigurationsComponent } from './Components/Content/configurations/configurations.component';


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
        canActivate: [authGuard],
         children: [
            // Rota padrão quando entra em /home (exibe uma tela de boas-vindas)
            { path: '', redirectTo: 'welcome', pathMatch: 'full' },
            { path: 'welcome', component: WelcomeComponent },
            { 
                path: 'userConfiguration', 
                component: UserConfigComponent, 
                canActivate: [roleGuard], 
                data: { expectedClaim: ClaimType.User } 
            },
            { 
                path: 'configuration', 
                component: ConfigurationsComponent,
                canActivate: [roleGuard],
                data: { expectedClaim: ClaimType.Admin}
            },
            { 
                path: 'welcome', 
                component: WelcomeComponent,
                canActivate: [roleGuard],
                data: { expectedClaim: ClaimType.User }
            }
        ]
    },


    { path: '**', redirectTo: '' }
];