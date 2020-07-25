import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

export class DiscordUser {
  id: string;
  username: string;
  hash: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private discordUser = new ReplaySubject<DiscordUser>(1);
  discordUser$ = this.discordUser.asObservable();

  constructor() {
    const discordUserJson = localStorage.getItem('discord_user');
    if (discordUserJson) {
      this.discordUser.next(JSON.parse(discordUserJson));
    }
  }

  setAuthentication(discordUser: DiscordUser): void {
    localStorage.setItem('discord_user', JSON.stringify(discordUser));
    this.discordUser.next(discordUser);
  }

  deleteAuthentication(): void {
    localStorage.removeItem('discord_user');
    this.discordUser.next(null);
  }
}
