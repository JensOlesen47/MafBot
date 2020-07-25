import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { RegisteredComponent } from './pages/registered/registered.component';
import { HostingComponent } from './pages/hosting/hosting.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'vote', redirectTo: 'game', pathMatch: 'full' },
  { path: 'game', component: GameComponent },
  { path: 'hosting', component: HostingComponent },
  { path: 'registration-confirmed', component: RegisteredComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
