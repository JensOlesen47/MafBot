import { Component, OnDestroy, OnInit } from '@angular/core';
import { DiscordUser } from '../../services/authentication.service';
import { WebsocketService } from '../../services/websocket.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatOptionSelectionChange } from '@angular/material/core';

interface HostedPlayer {
  userid: string;
  role: string;
  team: string;
}

interface HostedSetup {
  setup: string;
  players: HostedPlayer[];
}

interface Role {
  name: string;
  role: string;
  team: string;
}

@Component({
  selector: 'maf-hosting',
  templateUrl: './hosting.component.html',
  styleUrls: ['./hosting.component.scss'],
})
export class HostingComponent implements OnInit, OnDestroy {
  activeUsers: DiscordUser[];
  setup: HostedSetup;
  possibleRoles: Role[];

  private activesStreamSubscription: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.activesStreamSubscription = this.websocketService.activesStream.subscribe(
      (data) => {
        this.activeUsers = data;
      }
    );

    this.setup = {
      setup: 'vengeful',
      players: [
        { role: 'venge_t', team: 'town', userid: null },
        { role: 'venge_t', team: 'town', userid: null },
        { role: 'venge_t', team: 'town', userid: null },
        { role: 'venge_m', team: 'mafia', userid: null },
        { role: 'venge_gf', team: 'mafia', userid: null },
      ],
    };
    this.possibleRoles = [
      { name: 'Town Vengeful', role: 'venge_t', team: 'town' },
      { name: 'Town Vengeful', role: 'venge_t', team: 'town' },
      { name: 'Town Vengeful', role: 'venge_t', team: 'town' },
      { name: 'Mafia Goon', role: 'venge_m', team: 'mafia' },
      { name: 'Mafia Godfather', role: 'venge_gf', team: 'mafia' },
    ];
  }

  ngOnDestroy() {
    this.activesStreamSubscription.unsubscribe();
  }

  updateSetup($event: MatOptionSelectionChange, i: number) {
    if ($event.isUserInput) {
      this.setup.players[i].userid = $event.source.value;
      console.log(this.setup);
    }
  }

  isValid(): boolean {
    return this.setup.players.every((p) => p.userid);
  }

  submit() {
    this.http
      .post('/api/hosted', this.setup)
      .subscribe(() =>
        window.location.assign('https://mafbot.mafia451.com/game')
      );
  }

  isPlayerAlreadyChosen(player: DiscordUser): boolean {
    return this.setup.players.some((p) => p.userid === player.id);
  }
}
