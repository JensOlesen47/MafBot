import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  SocketClientPaths,
  WebsocketService,
} from '../../../services/websocket.service';

@Component({
  selector: 'maf-game-admin-menu',
  templateUrl: './game-admin-menu.component.html',
  styleUrls: ['./game-admin-menu.component.scss'],
})
export class GameAdminMenuComponent implements OnInit, OnDestroy {
  playerUsernames = [] as string[];

  private playerStreamSubscription: Subscription;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.playerStreamSubscription = this.websocketService.playersStream.subscribe(
      (data) => {
        this.playerUsernames = data
          .filter((player) => player.alive)
          .map((player) => player.username);
      }
    );
  }

  ngOnDestroy(): void {
    this.playerStreamSubscription.unsubscribe();
  }

  formalPlayer(player: string): void {
    this.websocketService.pushMessage({
      path: SocketClientPaths.FORMAL,
      username: player,
    });
  }

  modkillPlayer(player: string): void {
    this.websocketService.pushMessage({
      path: SocketClientPaths.MODKILL,
      username: player,
    });
  }

  cancelFormal(): void {
    this.websocketService.pushMessage({
      path: SocketClientPaths.CLEAR,
    });
  }

  revealVotes(): void {
    this.websocketService.pushMessage({
      path: SocketClientPaths.REVEAL,
    });
  }
}
