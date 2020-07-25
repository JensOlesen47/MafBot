import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

export enum GameStates {
  DEFAULT = 'default',
  FORMAL = 'formal',
}

@Component({
  selector: 'maf-game-state',
  templateUrl: './game-state.component.html',
  styleUrls: ['./game-state.component.scss'],
})
export class GameStateComponent implements OnInit, OnDestroy {
  GameStates = GameStates;
  gameState = GameStates.DEFAULT;

  private formalsStreamSubscription: Subscription;
  private revealsStreamSubscription: Subscription;
  private clearsStreamSubscription: Subscription;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.formalsStreamSubscription = this.websocketService.formalsStream.subscribe(
      () => {
        this.gameState = GameStates.FORMAL;
      }
    );

    this.revealsStreamSubscription = this.websocketService.revealsStream.subscribe(
      () => {
        this.gameState = GameStates.DEFAULT;
      }
    );

    this.clearsStreamSubscription = this.websocketService.clearsStream.subscribe(
      () => {
        this.gameState = GameStates.DEFAULT;
      }
    );
  }

  ngOnDestroy(): void {
    this.formalsStreamSubscription.unsubscribe();
    this.revealsStreamSubscription.unsubscribe();
    this.clearsStreamSubscription.unsubscribe();
  }
}
