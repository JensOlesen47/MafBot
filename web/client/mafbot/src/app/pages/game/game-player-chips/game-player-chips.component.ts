import { Component, OnDestroy, OnInit } from '@angular/core';
import { Player, WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'maf-game-player-chips',
  templateUrl: './game-player-chips.component.html',
  styleUrls: ['./game-player-chips.component.scss'],
})
export class GamePlayerChipsComponent implements OnInit, OnDestroy {
  players = [[]] as Player[][];

  private playersStreamSubscription: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    // this.players = [[
    //   {username: 'Urist', alive: true} as Player,
    //   {username: 'Mantis', alive: false, team: 'town'} as Player,
    //   {username: 'Elli', alive: true} as Player,
    //   {username: 'Keychain', alive: false, team: 'mafia'} as Player,
    //   {username: 'clem', alive: true} as Player,
    //   {username: 'Srceenplay', alive: true} as Player
    // ],
    //   [
    //   {username: 'StarV', alive: true} as Player,
    //   {username: 'M2H', alive: true} as Player,
    //   {username: 'Josh', alive: true} as Player,
    //   {username: 'DrCoconut', alive: true} as Player,
    //     {username: 'Fatmo', alive: true} as Player,
    //     {username: 'UFO Fever', alive: true} as Player]
    // ];
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
  }

  ngOnDestroy(): void {
    this.playersStreamSubscription.unsubscribe();
  }
}
