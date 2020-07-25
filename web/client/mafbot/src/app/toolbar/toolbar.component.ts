import { Component, OnInit } from '@angular/core';
import {
  AuthenticationService,
  DiscordUser,
} from '../services/authentication.service';

@Component({
  selector: 'maf-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  user: DiscordUser;

  constructor(private authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    this.authenticationService.discordUser$.subscribe((user) => {
      this.user = user;
    });
  }

  login(): void {
    window.location.assign('https://mafbot.mafia451.com/login');
  }

  logout(): void {
    window.location.assign(
      `https://mafbot.mafia451.com/logout?id=${this.user.id}`
    );
  }
}
