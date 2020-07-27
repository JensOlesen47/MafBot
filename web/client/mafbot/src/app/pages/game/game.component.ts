import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import {
  GamePhase,
  GameState,
  SocketClientPaths,
  WebsocketService,
  Setup,
} from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GameStateFormalComponent } from './game-state/game-state-formal/game-state-formal.component';
import { NightPhaseComponent } from './game-state/game-state-phase/night-phase/night-phase.component';
import { EndgameComponent } from './endgame/endgame.component';

@Component({
  selector: 'maf-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState;
  currentSetup: Setup;
  phase: GamePhase;
  formalledPlayer: string;
  formalTimer: number;
  formalInterval: number;
  isVoting = false;
  isVoting$ = new EventEmitter<boolean>();
  formalDialog: MatDialogRef<GameStateFormalComponent>;
  nightPhaseDialog: MatDialogRef<NightPhaseComponent>;
  nightTimer: number;
  nightInterval: number;
  endgameDialog: MatDialogRef<EndgameComponent>;

  private phasesStreamSubscription: Subscription;
  private formalsStreamSubscription: Subscription;
  private revealsStreamSubscription: Subscription;
  private clearsStreamSubscription: Subscription;
  private statesStreamSubscription: Subscription;
  private endgameStreamSubscription: Subscription;
  private currentsetupsStreamSubscription: Subscription;
  private votingSubscription: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.votingSubscription = this.isVoting$.subscribe(
      (v) => (this.isVoting = v)
    );

    this.phasesStreamSubscription = this.websocketService.phasesStream.subscribe(
      (phase) => {
        this.phase = phase;
        if (phase.phase === 'night' || phase.phase === 'dusk') {
          window.setTimeout(() => this.startNightPhase(), 2000);
        } else if (phase.phase === 'day' && this.nightInterval) {
          this.endNightPhase();
        }
      }
    );

    this.formalsStreamSubscription = this.websocketService.formalsStream.subscribe(
      (data) => {
        this.formalledPlayer = data;
        this.formalTimer = 60;
        this.formalInterval = window.setInterval(() => {
          if (--this.formalTimer <= 0) {
            window.clearInterval(this.formalInterval);
            delete this.formalInterval;
          }
        }, 1000);
        this.openFormalModal();
      }
    );

    this.revealsStreamSubscription = this.websocketService.revealsStream.subscribe(
      () => {
        this.cleanupFormal();
      }
    );

    this.clearsStreamSubscription = this.websocketService.clearsStream.subscribe(
      () => {
        this.cleanupFormal();
      }
    );

    this.statesStreamSubscription = this.websocketService.statesStream.subscribe(
      (data) => {
        if (data) {
          this.gameState = data;

          if (this.endgameDialog) {
            this.endgameDialog.close();
          }
        }
      }
    );

    this.endgameStreamSubscription = this.websocketService.endgamesStream.subscribe(
      (data) => {
        this.openEndgameModal(data);
      }
    );

    this.currentsetupsStreamSubscription = this.websocketService.currentsetupsStream.subscribe(
      (data) => {
        this.currentSetup = data;
      }
    );
  }

  ngOnDestroy(): void {
    this.phasesStreamSubscription.unsubscribe();
    this.formalsStreamSubscription.unsubscribe();
    this.revealsStreamSubscription.unsubscribe();
    this.clearsStreamSubscription.unsubscribe();
    this.currentsetupsStreamSubscription.unsubscribe();
    this.votingSubscription.unsubscribe();
  }

  in(): void {
    this.websocketService.pushMessage({ path: SocketClientPaths.IN });
  }

  startNightPhase(): void {
    this.nightTimer = 300;
    this.nightInterval = window.setInterval(() => {
      if (--this.nightTimer <= 0) {
        window.clearInterval(this.nightInterval);
        delete this.nightInterval;
      }
    }, 1000);
    this.openNightModal();
  }

  openNightModal(): void {
    this.nightPhaseDialog = this.matDialog.open(NightPhaseComponent, {
      data: {
        timeRemaining: this.nightTimer,
      },
    });
    const sub = this.nightPhaseDialog.afterClosed().subscribe(() => {
      delete this.nightPhaseDialog;
      sub.unsubscribe();
    });
  }

  endNightPhase(): void {
    if (this.nightPhaseDialog) {
      this.nightPhaseDialog.close();
    }
    if (this.nightInterval) {
      window.clearInterval(this.nightInterval);
      delete this.nightInterval;
    }
  }

  openFormalModal(): void {
    this.formalDialog = this.matDialog.open(GameStateFormalComponent, {
      data: {
        formalledPlayer: this.formalledPlayer,
        timeRemaining: this.formalTimer,
        isVoting: this.isVoting,
        isVoting$: this.isVoting$,
      },
    });
    const sub = this.formalDialog.afterClosed().subscribe(() => {
      delete this.formalDialog;
      sub.unsubscribe();
    });
  }

  private cleanupFormal(): void {
    if (this.formalDialog) {
      this.formalDialog.close();
    }
    delete this.formalledPlayer;
    this.isVoting = false;
    if (this.formalInterval) {
      window.clearInterval(this.formalInterval);
      delete this.formalInterval;
    }
  }

  private openEndgameModal(winners: string): void {
    this.cleanupFormal();
    this.endNightPhase();

    this.endgameDialog = this.matDialog.open(EndgameComponent, {
      data: {
        winningTeam: winners,
      },
    });
    const sub = this.endgameDialog.afterClosed().subscribe(() => {
      delete this.endgameDialog;
      sub.unsubscribe();
    });
  }

  getRoleNames(): string[] {
    return this.currentSetup.roles.map((r) => r.name);
  }
}
