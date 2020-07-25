import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { RegisteredComponent } from './pages/registered/registered.component';
import { HostingComponent } from './pages/hosting/hosting.component';
import { DeregisteredComponent } from './pages/deregistered/deregistered.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'vote', redirectTo: 'game', pathMatch: 'full' },
  { path: 'game', component: GameComponent },
  { path: 'hosting', component: HostingComponent },
  { path: 'registration-confirmed', component: RegisteredComponent },
  { path: 'deregistration-confirmed', component: DeregisteredComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
