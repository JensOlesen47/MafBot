import { Component, OnDestroy, OnInit } from '@angular/core';
import { Setup, WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'maf-game-setup',
  templateUrl: './game-setup.component.html',
  styleUrls: ['./game-setup.component.scss'],
})
export class GameSetupComponent implements OnInit, OnDestroy {
  setup: Setup;
  private currentsetupsStreamSubscription: Subscription;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.websocketService.currentsetupsStream.subscribe((data) => {
      this.setup = data;
    });
  }

  ngOnDestroy() {
    this.currentsetupsStreamSubscription.unsubscribe();
  }
}
