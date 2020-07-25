import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'maf-game-log',
  templateUrl: './game-log.component.html',
  styleUrls: ['./game-log.component.scss'],
})
export class GameLogComponent implements OnInit, OnDestroy {
  log = '';

  private logsStreamSubscription: Subscription;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.logsStreamSubscription = this.websocketService.logsStream.subscribe(
      (data) => {
        this.log = '> ' + data.join('\n> ');
      }
    );
  }

  ngOnDestroy(): void {
    this.logsStreamSubscription.unsubscribe();
  }
}
