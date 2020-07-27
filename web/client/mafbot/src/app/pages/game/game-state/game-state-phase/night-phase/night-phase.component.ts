import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Action,
  SocketClientPaths,
  WebsocketService,
} from '../../../../../services/websocket.service';
import { Subscription, forkJoin } from 'rxjs';
import { AuthenticationService } from '../../../../../services/authentication.service';

export interface NightPhaseDialogData {
  timeRemaining: number;
}

@Component({
  selector: 'maf-night-phase',
  templateUrl: './night-phase.component.html',
  styleUrls: ['./night-phase.component.scss'],
})
export class NightPhaseComponent implements OnInit, OnDestroy {
  actions: Action[];
  livingPlayers: string[];

  private rolesStreamSubscription: Subscription;
  private playersStreamSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<NightPhaseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NightPhaseDialogData,
    private websocketService: WebsocketService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.rolesStreamSubscription = this.websocketService.rolesStream.subscribe(
      (role) => {
        this.actions = role.actions.map((action) => ({
          ability: action,
          target: '',
        }));
      }
    );

    this.playersStreamSubscription = forkJoin([
      this.websocketService.playersStream,
      this.authenticationService.discordUser$,
    ]).subscribe((values) => {
      const players = values[0];
      const currentUser = values[1];
      this.livingPlayers = players
        .filter((p) => p.alive && p.username !== currentUser.username)
        .map((p) => p.username);
    });
  }

  ngOnDestroy(): void {
    this.rolesStreamSubscription.unsubscribe();
    this.playersStreamSubscription.unsubscribe();
  }

  submitActions(): void {
    this.actions.forEach((action) => {
      this.websocketService.pushMessage({
        path: SocketClientPaths.ACTION,
        action,
      });
    });
  }
}
