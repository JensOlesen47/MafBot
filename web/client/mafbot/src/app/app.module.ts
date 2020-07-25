import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { MatButtonModule } from '@angular/material/button';
import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { GameAdminMenuComponent } from './pages/game/game-admin-menu/game-admin-menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { GamePlayerChipsComponent } from './pages/game/game-player-chips/game-player-chips.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { GameLogComponent } from './pages/game/game-log/game-log.component';
import { GameHistoryComponent } from './pages/game/game-history/game-history.component';
import { GameVoteComponent } from './pages/game/game-vote/game-vote.component';
import { CountdownTimerComponent } from './pages/game/countdown-timer/countdown-timer.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GameStateFormalComponent } from './pages/game/game-state/game-state-formal/game-state-formal.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GameStateComponent } from './pages/game/game-state/game-state.component';
import { MatDividerModule } from '@angular/material/divider';
import { GameStateDefaultComponent } from './pages/game/game-state/game-state-default/game-state-default.component';
import { MatCardModule } from '@angular/material/card';
import { PlayerChipComponent } from './pages/game/player-chip/player-chip.component';
import { GameNotificationComponent } from './pages/game/game-state/game-state-default/game-notification/game-notification.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { GameRoleComponent } from './pages/game/game-role/game-role.component';
import { GameRoleDialogComponent } from './pages/game/game-role/game-role-dialog/game-role-dialog.component';
import { GameSetupComponent } from './pages/game/game-setup/game-setup.component';
import { RegisteredComponent } from './pages/registered/registered.component';
import { NightPhaseComponent } from './pages/game/game-state/game-state-phase/night-phase/night-phase.component';
import { HostingComponent } from './pages/hosting/hosting.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientModule } from '@angular/common/http';
import { DeregisteredComponent } from './pages/deregistered/deregistered.component';

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    HomeComponent,
    GameComponent,
    GameAdminMenuComponent,
    GamePlayerChipsComponent,
    GameLogComponent,
    GameHistoryComponent,
    GameVoteComponent,
    CountdownTimerComponent,
    GameStateFormalComponent,
    GameStateComponent,
    GameStateDefaultComponent,
    PlayerChipComponent,
    GameNotificationComponent,
    GameRoleComponent,
    GameRoleDialogComponent,
    GameSetupComponent,
    RegisteredComponent,
    NightPhaseComponent,
    HostingComponent,
    DeregisteredComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatCardModule,
    MatSidenavModule,
    MatGridListModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
