import { Component, EventEmitter, Input } from '@angular/core';
import {
  SocketClientPaths,
  WebsocketService,
} from '../../../services/websocket.service';

@Component({
  selector: 'maf-game-vote',
  templateUrl: './game-vote.component.html',
  styleUrls: ['./game-vote.component.scss'],
})
export class GameVoteComponent {
  @Input() isVoting: boolean;
  @Input() isVoting$: EventEmitter<boolean>;

  constructor(private websocketService: WebsocketService) {}

  sendVoteMessage(checked: boolean): void {
    if (checked) {
      this.isVoting$.emit(true);
      this.websocketService.pushMessage({ path: SocketClientPaths.VOTE });
    } else {
      this.isVoting$.emit(false);
      this.websocketService.pushMessage({ path: SocketClientPaths.UNVOTE });
    }
  }
}
