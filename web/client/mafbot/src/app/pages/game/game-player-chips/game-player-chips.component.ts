import { Component, OnDestroy, OnInit } from '@angular/core';
import { Player, WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { skip } from 'rxjs/operators';

@Component({
  selector: 'maf-game-player-chips',
  templateUrl: './game-player-chips.component.html',
  styleUrls: ['./game-player-chips.component.scss'],
})
export class GamePlayerChipsComponent implements OnInit, OnDestroy {
  players = [[]] as Player[][];

  private playersStreamSubscription: Subscription;
  private statesStreamSubscription: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.playersStreamSubscription = this.websocketService.playersStream.subscribe(
      (data) => {
        if (data.length > 6) {
          const dead = data.filter((player) => !player.alive);
          const deadSplitIndex =
            data.length % 2
              ? Math.floor(dead.length / 2)
              : Math.ceil(dead.length / 2);
          const dead1 = dead.slice(0, deadSplitIndex);
          const dead2 = dead.slice(deadSplitIndex);

          const alive = data.filter((player) => player.alive);
          const aliveSplitIndex =
            data.length % 2
              ? Math.ceil(alive.length / 2)
              : Math.floor(alive.length / 2);
          const alive1 = alive.slice(0, aliveSplitIndex);
          const alive2 = alive.slice(aliveSplitIndex);

          this.players = [
            [...alive1, ...dead1],
            [...alive2, ...dead2],
          ];
        } else {
          this.players = [data.sort((player) => (player.alive ? -1 : 1))];
        }
      }
    );

    this.statesStreamSubscription = this.websocketService.statesStream
      .pipe(skip(1))
      .subscribe((state) => {
        if (state) {
          this.players = [[]];
        }
      });
  }

  ngOnDestroy(): void {
    this.playersStreamSubscription.unsubscribe();
  }
}
