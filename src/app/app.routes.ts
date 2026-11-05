import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Login/login/login.component';
import { DashboardComponent } from './Components/Content/dashboard/dashboard.component';
import { authGuard } from './Guards/auth.guard';
import { guestGuard } from './Guards/guest.guard';
import { UserConfigComponent } from './Components/Content/user-config/user-config.component';
import { roleGuard } from './Guards/role.guard';
import { WelcomeComponent } from './Components/Content/welcome/welcome.component';
import { userResolver } from './Guards/Resolvers/user.resolver';
import { ComingSoonComponent } from './Components/Content/coming-soon/coming-soon.component';
import { ProfileComponent } from './Components/Content/profile/profile.component';
import { CitiesConfigComponent } from './Components/Content/cities-config/cities-config.component';
import { BancasListComponent } from './Components/Content/bancas/bancas-list/bancas-list.component';
import { BancaDetailComponent } from './Components/Content/bancas/banca-detail/banca-detail.component';
import { ManageBancasComponent } from './Components/Content/bancas/manage-bancas/manage-bancas.component';
import { BancaEditorComponent } from './Components/Content/bancas/banca-editor/banca-editor.component';


export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        // Área pública: visitante navega sem login. Telas internas têm guard próprio.
        path: '',
        component: DashboardComponent,
        resolve: { userData: userResolver },
        children: [
            { path: '', component: WelcomeComponent, pathMatch: 'full' },
            { path: 'bancas', component: BancasListComponent },
            { path: 'bancas/:id', component: BancaDetailComponent },
            {
                path: 'gerenciar-bancas',
                component: ManageBancasComponent,
                canActivate: [roleGuard],
                data: { expectedRole: 'avaliador' }
            },
            {
                // "nova" ou o id da banca
                path: 'gerenciar-bancas/:id',
                component: BancaEditorComponent,
                canActivate: [roleGuard],
                data: { expectedRole: 'avaliador' }
            },
            { path: 'validar-certificado', component: ComingSoonComponent, data: { title: 'Validar certificado' } },
            {
                path: 'meus-dados',
                component: ProfileComponent,
                canActivate: [authGuard]
            },
            {
                path: 'usuarios',
                component: UserConfigComponent,
                canActivate: [roleGuard],
                data: { expectedRole: 'adminCas' }
            },
            {
                path: 'cidades',
                component: CitiesConfigComponent,
                canActivate: [roleGuard],
                data: { expectedRole: 'adminGeral' }
            }
        ]
    },

    // Endereços antigos
    { path: 'home', redirectTo: '' },
    { path: 'home/userConfiguration', redirectTo: 'usuarios' },

    { path: '**', redirectTo: '' }
];
