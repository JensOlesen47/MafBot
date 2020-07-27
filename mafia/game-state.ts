import { Core } from "../core/core";
import actions = require("./commands/actions");
import commands = require("./commands/commands");
import { GuildMember, Message, Role, TextChannel, User } from "discord.js";
import { getAbility } from "./libs/abilities.lib";
import { Action, checkForFullActionQueue } from "./commands/actions";
import { MafiaPlayer } from "./libs/setups.lib";
import { currentSetup, video, setSetup, testGame } from "./setup";
import {
  addBasicHistory,
  addVoteHistory,
  getHistory,
  updateHistoryUserDeath,
  updateHistoryWinners,
} from "../core/db/history";
import { Config, RevealType } from "../core/config";
import {
  webSendMessage,
  webUpdateLivingPlayers,
  webRecordVoteHistory,
  webUpdatePhase,
  webUpdateGameState,
  webUpdateGameSetup,
  webEndGame,
} from "../web/http";

export enum Status {
  NONE = "",
  SIGNUPS = "signups",
  PROGRESS = "in progress",
}
export enum Phase {
  DAY = "day",
  NIGHT = "night",
  DUSK = "dusk",
}
export class GamePhase {
  phase: Phase;
  number: number;
  constructor(phase: Phase, number: number) {
    this.phase = phase;
    this.number = number;
  }
  toString(): string {
    return `${this.phase} ${this.number}`;
  }
}
export class Vote {
  voter: GuildMember;
  votee: string;
  constructor(voter: GuildMember, votee: string) {
    this.voter = voter;
    this.votee = votee;
  }
}
export class Votecount {
  entries: VotecountEntry[];
  constructor(votes: Vote[]) {
    this.entries = [];
    votes.forEach((vote) => {
      const existingEntry = this.entries.find(
        (entry) => entry.votee === vote.votee
      );
      if (existingEntry) {
        existingEntry.voters.push(vote.voter);
      } else {
        this.entries.push(new VotecountEntry(vote.votee, vote.voter));
      }
    });
    this.entries.sort((a, b) => {
      if (!b.votee) {
        // ensure that nonvoters are always at the bottom
        return -1;
      }
      return b.voters.length - a.voters.length;
    });
  }
}
export class VotecountEntry {
  votee: string;
  voters: GuildMember[];
  constructor(votee: string, voter: GuildMember) {
    this.votee = votee;
    this.voters = [voter];
  }
}
export class Player extends GuildMember {
  mafia: MafiaPlayer;
}

let gameStatus: Status = Status.NONE;
let gamePhase: GamePhase;
let duskAwaitingPlayer: Player;

export let moderator: User;
export let moderatorSetupMessage: Message;
export let players: Player[] = [];
export let votes: Vote[] = [];
export let playerrole: Role;
export let channel: TextChannel;

export async function sendMessage(msg: string): Promise<void> {
  video ? webSendMessage(msg) : await channel.send(msg);
}

export function isGameInSignups(): boolean {
  return gameStatus === Status.SIGNUPS;
}
export function isGameInProgress(): boolean {
  return gameStatus === Status.PROGRESS;
}
export function isGameOver(): boolean {
  return gameStatus === Status.NONE;
}
export async function setGameInSignups(): Promise<void> {
  gameStatus = Status.SIGNUPS;
  webUpdateGameState(gameStatus);
}
export async function setGameInProgress(): Promise<void> {
  gameStatus = Status.PROGRESS;
  webUpdateGameState(gameStatus);
  const startPhase = currentSetup.start || Phase.NIGHT;
  if (startPhase === Phase.DAY) {
    gamePhase = new GamePhase(Phase.NIGHT, 0);
  } else {
    gamePhase = new GamePhase(Phase.DAY, 0);
  }
  await advancePhase();
}
export function isDay(): boolean {
  return gamePhase && gamePhase.phase === Phase.DAY;
}
export function isNight(): boolean {
  return gamePhase && gamePhase.phase === Phase.NIGHT;
}
export function isDusk(): boolean {
  return gamePhase && gamePhase.phase === Phase.DUSK;
}
export function isDuskAwaitingPlayer(user: User): boolean {
  return duskAwaitingPlayer && duskAwaitingPlayer.user === user;
}
export async function advancePhase(): Promise<void> {
  if (!isGameInProgress()) {
    return;
  }
  resetVotes();
  duskAwaitingPlayer = null;
  if (isNight() || currentSetup.nightless || currentSetup.unimplemented) {
    if (isNight()) {
      await actions.resolveActions();
    }
    gamePhase.phase = Phase.DAY;
    gamePhase.number += 1;
    sendMessage(
      `It is now ${gamePhase.toString()}. With ${
        players.filter((player) => player.mafia.alive).length
      } alive, it takes ${getLynchThreshold()} to lynch.`
    );
    if (!video) {
      await Core.unmute(channel);
    }
  } else {
    gamePhase.phase = Phase.NIGHT;
    sendMessage(`It is now ${gamePhase.toString()}. Send in your actions!`);
    if (!video) {
      await Core.mute(channel);
    }
    await checkForFullActionQueue();
  }

  if (video) {
    webUpdatePhase(gamePhase);
  }
  await checkForOnPhase();
}

export function setModeratorMessage(message: Message): void {
  moderatorSetupMessage = message;
}

export async function startGame(): Promise<void> {
  sendMessage(
    `The game is afoot!\nPlayers (${players.length}): ${players
      .map((player) =>
        video
          ? player.displayName
          : Core.findUserMention(channel, player.displayName)
      )
      .join(", ")}`
  );
  if (!testGame) {
    await addBasicHistory(currentSetup, players, channel.guild.id, video);
  }
  await setGameInProgress();
  if (video) {
    webUpdateLivingPlayers(players);
  }
}

export function getLynchThreshold(): number {
  return Math.floor(
    players.filter((player) => player.mafia.alive).length / 2 + 1
  );
}

export function getVotecount(): Votecount {
  return new Votecount(votes);
}

export function resetVotes(): void {
  votes = [];
  players.forEach((player) => {
    if (player.mafia.alive) {
      votes.push(new Vote(player, ""));
    }
  });
}

export async function checkForLynch(formal?: string): Promise<void> {
  const vc = getVotecount();
  const lynchThreshold = getLynchThreshold();
  for (let entry of vc.entries) {
    if (entry.voters.length >= lynchThreshold && entry.votee) {
      await lynchPlayer(entry, entry.votee);
      return;
    }
  }
  if (video) {
    const formalVc = vc.entries.find((e) => e.votee) || {
      votee: formal,
      voters: [],
    };
    const formalledPlayer = players.find((p) => p.displayName === formal);
    if (!testGame) {
      await addVoteHistory(formalledPlayer, vc, gamePhase.number, 2);
    }
    webRecordVoteHistory(formalVc);
  }
}

export async function lynchPlayer(
  fullVotecount: VotecountEntry,
  lyncheeName: string
): Promise<void> {
  if (!video) {
    await commands.voteCount(channel);
  }
  sendMessage(`A majority vote has been achieved!`);
  if (lyncheeName === "No Lynch") {
    sendMessage(`Nobody was lynched!`);
    await advancePhase();
  } else {
    const lynchee = players.find(
      (player) => player.displayName === lyncheeName
    );
    await playerDeath(lynchee, "has been lynched");

    if (!testGame) {
      await addVoteHistory(
        lynchee,
        getVotecount(),
        gamePhase.number,
        video ? 2 : 1
      );
      await updateHistoryUserDeath(
        lynchee.id,
        `lynched ${gamePhase.toString()}`
      );
    }
    if (video) {
      webRecordVoteHistory(fullVotecount);
    }

    await checkForOnRoleDeath(lynchee);
    await checkForOnLynch(lynchee);
    await checkForGhostAction(lynchee);

    const deadRole = lynchee.mafia.role.truename || lynchee.mafia.role.name;
    const playersWithRoleLynchTrigger = players.filter(
      (player) => player.mafia.role.status.onrolelynch
    );
    for (const player of playersWithRoleLynchTrigger) {
      const onrolelynch = player.mafia.role.status.onrolelynch;
      await checkOnDeathTriggers(onrolelynch, deadRole, player);
    }

    await checkForEndgame();
    await advancePhase();
  }
}

async function checkForOnLynch(lynchee: Player): Promise<void> {
  const onLynch = lynchee.mafia.role.status.onlynch;
  if (onLynch === "supersaint") {
    const votecount = getVotecount();
    const voters = votecount.entries.find(
      (entry) => entry.votee === lynchee.displayName
    ).voters;
    const hammerer = voters[voters.length - 1];
    if (lynchee !== hammerer) {
      const playerToKill = players.find((player) => player === hammerer);
      await killPlayer(playerToKill);
    }
  }
}

export async function addPlayer(user: GuildMember): Promise<void> {
  const player = user as Player;
  players.push(player);
  webUpdateLivingPlayers(players);
  webUpdateGameSetup(currentSetup);
  await user.addRole(playerrole);
}

export async function removePlayer(user: GuildMember): Promise<void> {
  players.splice(players.indexOf(user as Player), 1);
  webUpdateLivingPlayers(players);
  webUpdateGameSetup(currentSetup);
  await user.removeRole(playerrole);
}

export async function killPlayer(
  user: Player,
  killedString: string = "was killed"
): Promise<void> {
  await playerDeath(user, killedString);

  await checkForOnRoleKill(user);
  await checkForOnRoleDeath(user);

  if (!testGame) {
    await updateHistoryUserDeath(user.id, `killed ${gamePhase.toString()}`);
  }

  await checkForEndgame();
  if (isDay()) {
    sendMessage(
      `With ${
        players.filter((player) => player.mafia.alive).length
      } left alive, it now takes ${getLynchThreshold()} to lynch.`
    );
  }
}

async function checkForOnRoleKill(user: Player): Promise<void> {
  const deadRole = user.mafia.role.truename || user.mafia.role.name;
  const playersWithRoleKillTrigger = players.filter(
    (player) => player.mafia.role.status.onrolekill && player.mafia.alive
  );
  for (const player of playersWithRoleKillTrigger) {
    const onrolekill = player.mafia.role.status.onrolekill;
    await checkOnDeathTriggers(onrolekill, deadRole, player);
  }
}

async function checkForOnPhase(): Promise<void> {
  for (const player of players) {
    const onphase = player.mafia.role.status.onphase;
    if (onphase && onphase.startsWith(gamePhase.toString())) {
      const actionString = onphase.split(`${gamePhase.toString()}:`)[1];
      const actionFn = await actions.deduceActionFromRole(actionString, player);
      await actionFn();
    }
  }
}

export async function checkForEndgame(): Promise<void> {
  console.log("checking for endgame...");
  if (!isGameInProgress()) {
    return;
  }

  const livingPlayers = players.filter((player) => player.mafia.alive);
  const livingMafia = livingPlayers.filter(
    (player) => player.mafia.team.name === "mafia"
  );
  const livingTown = livingPlayers.filter(
    (player) => player.mafia.team.name === "town"
  );
  const isSkAlive =
    livingPlayers.length - livingMafia.length - livingTown.length > 0;
  let winningTeam, winningPlayers;

  if (livingTown.length === livingPlayers.length) {
    winningTeam = "town";
    winningPlayers = getWinningPlayers("town");
  } else if (!isSkAlive && livingMafia.length >= livingPlayers.length / 2) {
    winningTeam = "mafia";
    winningPlayers = getWinningPlayers("mafia");
  } else if (
    isSkAlive &&
    (livingPlayers.length === 1 ||
      (livingPlayers.length === 2 && livingTown.length === 1))
  ) {
    winningTeam = "sk";
    winningPlayers = getWinningPlayers("sk");
  }

  if (winningTeam) {
    await triggerEndGame(winningTeam, winningPlayers);
  }
}

export async function endGame(): Promise<void> {
  for (const player of players) {
    if (player.roles.some((role) => role === playerrole)) {
      await player.removeRole(playerrole);
    }
  }
  if (video) {
    players.forEach((p) => (p.mafia.alive = false));
    webUpdateLivingPlayers(players);
  }
  players = [];
  moderator = null;
  moderatorSetupMessage = null;
  votes = [];
  setSetup(null);
  gameStatus = Status.NONE;
  gamePhase = null;
  webUpdateGameState(gameStatus);
  await Core.unmute(channel);
}

async function triggerEndGame(
  winningTeam: string,
  winningPlayers: string
): Promise<void> {
  if (isGameInProgress()) {
    const playerString = players
      .map(
        (player) =>
          `${player.displayName} (${
            player.mafia.role.truename || player.mafia.role.name
          })`
      )
      .join(", ");
    sendMessage(
      `Game Over! The ${winningTeam} wins! \:tada:\nWinners: ${winningPlayers}\nPlayers: ${playerString}`
    );
    const lastHistory = await getHistory(1);
    if (!testGame) {
      await updateHistoryWinners(winningTeam, lastHistory[0].id);
    }
    webEndGame(winningTeam);
    await endGame();
  }
}

async function checkForGhostAction(user: Player) {
  const ghostAction = user.mafia.role.status.ghostaction;
  if (ghostAction) {
    gamePhase.phase = Phase.DUSK;
    webUpdatePhase(gamePhase);
    duskAwaitingPlayer = user;
    await Core.mute(channel);

    const giveability = getAbility("giveability") as Action;
    giveability.victims = [user];
    if (!user.mafia.role.status.gifts) {
      user.mafia.role.status.gifts = [];
    }
    user.mafia.role.status.gifts.push(ghostAction);
    giveability.actioner = user;
    await actions.giveability(giveability);

    sendMessage(
      `Waiting for ${user.displayName} to submit a ${ghostAction}...`
    );
    const submitted = await Core.waitWithCheck(() => !isDusk(), 2, 600);
    if (!submitted) {
      sendMessage(
        `Timed out while waiting for ${user.displayName} to get his poop in a group.`
      );
    }
    await checkForEndgame();
  }
}

async function playerDeath(user: Player, killedString: string): Promise<void> {
  sendMessage(
    `${user.displayName} ${killedString}!${getRevealString(user.mafia)}`
  );

  console.log("removing player " + user.displayName);
  await user.removeRole(playerrole);
  user.mafia.alive = false;
  if (video) {
    webUpdateLivingPlayers(players, user, killedString);
  }
}

function getRevealString(playerRole: MafiaPlayer): string {
  switch (Config.reveals) {
    case RevealType.FULL:
      return ` They were a ${playerRole.role.name} (${playerRole.team.name}).`;
    case RevealType.PARTIAL:
      return ` They were ${playerRole.team.name}.`;
    case RevealType.NONE:
      return ``;
  }
}

async function checkForOnRoleDeath(user: Player): Promise<void> {
  const deadRole = user.mafia.role.truename || user.mafia.role.name;
  const playersWithRoleDeathTrigger = players.filter(
    (player) => player.mafia.role.status.onroledeath && player.mafia.alive
  );
  for (const player of playersWithRoleDeathTrigger) {
    const onroledeath = player.mafia.role.status.onroledeath;
    await checkOnDeathTriggers(onroledeath, deadRole, player);
  }
}

async function checkOnDeathTriggers(
  onRoleDeathTrigger: string,
  deadRole: string,
  player: Player
): Promise<void> {
  const trigger = onRoleDeathTrigger.split(":");

  const triggeringRole = trigger[0];
  if (deadRole !== triggeringRole) {
    return;
  }

  if (trigger.includes("win")) {
    let winningTeam = player.mafia.team.name;
    const winningPlayers = getWinningPlayers(winningTeam);
    await triggerEndGame(winningTeam, winningPlayers);
  } else if (trigger.includes("action")) {
    const actionFn = await actions.deduceActionFromRole(
      `${trigger[1]}:${trigger[2]}`,
      player
    );
    await actionFn();
  }
}

function getWinningPlayers(team: string): string {
  return players
    .filter((player) => player.mafia.team.name === team)
    .map((player) => `${player.displayName}`)
    .join(", ");
}
