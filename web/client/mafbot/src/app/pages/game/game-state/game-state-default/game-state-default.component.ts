import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  WebsocketService,
  Death,
  Player,
} from '../../../../services/websocket.service';
import { NotificationConfig } from './game-notification/game-notification.component';
import { first } from 'rxjs/operators';
import { isEqual } from 'lodash';

@Component({
  selector: 'maf-game-state-default',
  templateUrl: './game-state-default.component.html',
  styleUrls: ['./game-state-default.component.scss'],
})
export class GameStateDefaultComponent implements OnInit, OnDestroy {
  notifications = [] as NotificationConfig[];
  private formalledPlayer: string;
  private lynchDeath: Death;

  private revealsStreamSubscription: Subscription;
  private formalsStreamSubscription: Subscription;
  private deathsStreamSubscription: Subscription;
  private phasesStreamSubscription: Subscription;
  private statesStreamSubscription: Subscription;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.revealsStreamSubscription = this.websocketService.revealsStream.subscribe(
      (data) => {
        const voteNotification = {
          type: 'vote',
          subject: { username: this.formalledPlayer },
          voters: data.map((d) => ({ username: d })),
        } as NotificationConfig;

        if (this.lynchDeath) {
          voteNotification.subject.team = this.lynchDeath.team;
          this.pushNotification(voteNotification);
          delete this.lynchDeath;
        } else {
          this.pushNotification(voteNotification);
        }
      }
    );

    this.formalsStreamSubscription = this.websocketService.formalsStream.subscribe(
      (data) => {
        this.formalledPlayer = data;
      }
    );

    this.deathsStreamSubscription = this.websocketService.deathsStream.subscribe(
      (data) => {
        if (data.method === 'vote') {
          this.lynchDeath = data;
        } else {
          this.pushNotification({
            type: 'kill',
            subject: { username: data.username, team: data.team } as Player,
          });
        }
        this.notifications
          .filter((n) => n.subject)
          .forEach((n) => {
            if (n.subject.username === data.username) {
              n.subject.team = data.team;
            }
            if (n.voters) {
              n.voters.forEach((v) => {
                if (v.username === data.username) {
                  v.team = data.team;
                }
              });
            }
          });
      }
    );

    this.phasesStreamSubscription = this.websocketService.phasesStream.subscribe(
      (data) => {
        // This can happen when we load the page
        if (
          this.notifications.some((notification) =>
            isEqual(notification.phase, data)
          )
        ) {
          return;
        }
        this.pushNotification({
          type: 'phase',
          phase: data,
        });
      }
    );

    this.websocketService.historiesStream.pipe(first()).subscribe((data) => {
      this.notifications = data.reverse();
    });

    this.statesStreamSubscription = this.websocketService.statesStream.subscribe(
      (data) => {
        if (data === 'signups') {
          this.notifications = [];
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.revealsStreamSubscription.unsubscribe();
    this.formalsStreamSubscription.unsubscribe();
    this.deathsStreamSubscription.unsubscribe();
    this.phasesStreamSubscription.unsubscribe();
    this.statesStreamSubscription.unsubscribe();
  }

  private pushNotification(item: NotificationConfig): void {
    this.notifications.unshift(item);
  }
}
