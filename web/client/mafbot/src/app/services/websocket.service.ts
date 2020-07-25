import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { ReplaySubject } from 'rxjs';
import { AuthenticationService, DiscordUser } from './authentication.service';
import { NotificationConfig } from '../pages/game/game-state/game-state-default/game-notification/game-notification.component';

export enum SocketServerPaths {
  PLAYERS = 'players',
  FORMALS = 'formals',
  REVEALS = 'reveals',
  CLEARS = 'clears',
  HISTORIES = 'histories',
  LOGS = 'logs',
  PHASES = 'phases',
  DEATHS = 'deaths',
  STATES = 'states',
  CURRENTSETUPS = 'currentsetups',
  ROLES = 'roles',
  ACTIVES = 'actives',
}

export enum SocketClientPaths {
  AUTH = 'auth',
  VOTE = 'vote',
  UNVOTE = 'unvote',
  CLEAR = 'clear',
  REVEAL = 'reveal',
  FORMAL = 'formal',
  MODKILL = 'modkill',
  IN = 'in',
}

export class SocketServerMessage {
  path: SocketServerPaths;
}

export class SocketClientMessage {
  path: SocketClientPaths;
  from?: DiscordUser;
}

export class PlayersSocketServerMessage extends SocketServerMessage {
  players: Player[];
}

export class FormalsSocketServerMessage extends SocketServerMessage {
  username: string;
}

export class RevealsSocketServerMessage extends SocketServerMessage {
  votes: string[];
}

export class ClearsSocketServerMessage extends SocketServerMessage {}

export class HistoriesSocketServerMessage extends SocketServerMessage {
  histories: NotificationConfig[];
}

export class LogsSocketServerMessage extends SocketServerMessage {
  log: string[];
}

export class PhasesSocketServerMessage extends SocketServerMessage {
  phase: GamePhase;
}

export class DeathsSocketServerMessage extends SocketServerMessage {
  death: Death;
}

export class StatesSocketServerMessage extends SocketServerMessage {
  state: GameState;
}

export class CurrentsetupsSocketServerMessage extends SocketServerMessage {
  setup: Setup;
}

export class RolesSocketServerMessage extends SocketServerMessage {
  role: Role;
}

export class ActivesSocketServerMessage extends SocketServerMessage {
  users: DiscordUser[];
}

export class UsernameSocketClientMessage extends SocketClientMessage {
  username: string;
}

export class Player {
  id: string;
  username: string;
  alive: boolean;
  team: string;
}

export class Votecount {
  votee: Player;
  voters: Player[];
}

export class GamePhase {
  phase: 'day' | 'night' | 'dusk';
  number: number;
}

export class Death {
  username: string;
  team: string;
  method: 'vote' | 'kill';
}

export class Setup {
  name: string;
  helptext: string;
  roles: Role[];
}

export class Role {
  name: string;
  team: string;
  helptext: string;
  actions: string[];
  buddies: string[];
}

export type GameState = '' | 'signups' | 'in progress';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private user: DiscordUser;

  private socketServer = webSocket<SocketServerMessage | SocketClientMessage>(
    `wss://mafbot.mafia451.com/ws`
  );

  private playersSubject = new ReplaySubject<Player[]>(1);
  playersStream = this.playersSubject.asObservable();

  private formalsSubject = new ReplaySubject<string>(1);
  formalsStream = this.formalsSubject.asObservable();

  private revealsSubject = new ReplaySubject<string[]>(1);
  revealsStream = this.revealsSubject.asObservable();

  private clearsSubject = new ReplaySubject<void>(1);
  clearsStream = this.clearsSubject.asObservable();

  private historiesSubject = new ReplaySubject<NotificationConfig[]>(1);
  historiesStream = this.historiesSubject.asObservable();

  private logsSubject = new ReplaySubject<string[]>(1);
  logsStream = this.logsSubject.asObservable();

  private phasesSubject = new ReplaySubject<GamePhase>(1);
  phasesStream = this.phasesSubject.asObservable();

  private deathsSubject = new ReplaySubject<Death>(1);
  deathsStream = this.deathsSubject.asObservable();

  private statesSubject = new ReplaySubject<GameState>(1);
  statesStream = this.statesSubject.asObservable();

  private currentsetupsSubject = new ReplaySubject<Setup>(1);
  currentsetupsStream = this.currentsetupsSubject.asObservable();

  private rolesSubject = new ReplaySubject<Role>(1);
  rolesStream = this.rolesSubject.asObservable();

  private activesSubject = new ReplaySubject<DiscordUser[]>(1);
  activesStream = this.activesSubject.asObservable();

  constructor(private authenticationService: AuthenticationService) {
    this.authenticationService.discordUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.pushMessage({ path: SocketClientPaths.AUTH });
      }
    });

    window.addEventListener('unload', () => this.socketServer.complete());

    this.socketServer.subscribe((data: SocketServerMessage) => {
      console.log('Received socket data on path : ' + data.path);
      switch (data.path) {
        case SocketServerPaths.PLAYERS:
          this.playersSubject.next(
            (data as PlayersSocketServerMessage).players
          );
          break;
        case SocketServerPaths.FORMALS:
          this.formalsSubject.next(
            (data as FormalsSocketServerMessage).username
          );
          break;
        case SocketServerPaths.REVEALS:
          this.revealsSubject.next((data as RevealsSocketServerMessage).votes);
          break;
        case SocketServerPaths.CLEARS:
          this.clearsSubject.next();
          break;
        case SocketServerPaths.HISTORIES:
          this.historiesSubject.next(
            (data as HistoriesSocketServerMessage).histories
          );
          break;
        case SocketServerPaths.LOGS:
          this.logsSubject.next((data as LogsSocketServerMessage).log);
          break;
        case SocketServerPaths.PHASES:
          this.phasesSubject.next((data as PhasesSocketServerMessage).phase);
          break;
        case SocketServerPaths.DEATHS:
          this.deathsSubject.next((data as DeathsSocketServerMessage).death);
          break;
        case SocketServerPaths.STATES:
          this.statesSubject.next((data as StatesSocketServerMessage).state);
          break;
        case SocketServerPaths.CURRENTSETUPS:
          this.currentsetupsSubject.next(
            (data as CurrentsetupsSocketServerMessage).setup
          );
          break;
        case SocketServerPaths.ROLES:
          this.rolesSubject.next((data as RolesSocketServerMessage).role);
          break;
        case SocketServerPaths.ACTIVES:
          this.activesSubject.next((data as ActivesSocketServerMessage).users);
          break;
        default:
          throw new Error('Unrecognized websocket path');
      }
    });
  }

  pushMessage<T extends SocketClientMessage>(message: T): void {
    const from = (this.user
      ? { id: this.user.id, username: this.user.username }
      : {}) as DiscordUser;
    this.socketServer.next({ ...message, from });
  }
}
