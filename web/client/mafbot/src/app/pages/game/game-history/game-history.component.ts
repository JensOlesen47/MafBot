import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../../services/websocket.service';

@Component({
  selector: 'maf-game-history',
  templateUrl: './game-history.component.html',
  styleUrls: ['./game-history.component.scss'],
})
export class GameHistoryComponent implements OnInit {
  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.websocketService.historiesStream.subscribe((data) => {});
  }
}
