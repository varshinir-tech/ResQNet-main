import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { CitizenDashboardComponent } from './pages/citizen-dashboard/citizen-dashboard.component';
import { ReportSosComponent } from './pages/report-sos/report-sos.component';
import { MyReportsComponent } from './pages/my-reports/my-reports.component';
import { IncidentDetailsComponent } from './pages/incident-details/incident-details.component';
import { InteractiveMapComponent } from './pages/interactive-map/interactive-map.component';
import { SheltersComponent } from './pages/shelters/shelters.component';
import { VolunteersComponent } from './pages/volunteers/volunteers.component';
import { DonationsComponent } from './pages/donations/donations.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'citizen-dashboard', component: CitizenDashboardComponent, canActivate: [authGuard] },
  { path: 'report-sos', component: ReportSosComponent, canActivate: [authGuard] },
  { path: 'my-reports', component: MyReportsComponent, canActivate: [authGuard] },
  { path: 'incidents/:id', component: IncidentDetailsComponent, canActivate: [authGuard] },
  { path: 'map', component: InteractiveMapComponent },
  { path: 'shelters', component: SheltersComponent },
  { path: 'volunteers', component: VolunteersComponent },
  { path: 'donations', component: DonationsComponent },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent }
];
