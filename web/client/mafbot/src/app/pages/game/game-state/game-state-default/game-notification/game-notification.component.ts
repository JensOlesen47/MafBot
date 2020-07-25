import { Component, Input, OnInit } from '@angular/core';
import { GamePhase, Player } from '../../../../../services/websocket.service';

export class NotificationConfig {
  type: 'kill' | 'vote' | 'phase';
  subject?: Player; // kill/vote
  voters?: Player[]; // vote
  phase?: GamePhase; // phase
}

@Component({
  selector: 'maf-game-notification',
  templateUrl: './game-notification.component.html',
  styleUrls: ['./game-notification.component.scss'],
})
export class GameNotificationComponent implements OnInit {
  @Input() config: NotificationConfig;
  @Input() index: number;

  constructor() {}

  ngOnInit(): void {}
}
