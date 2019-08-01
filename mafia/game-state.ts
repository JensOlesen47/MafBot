import {Core} from "../core/core";
import actions = require('./commands/actions');
import commands = require('./commands/commands');
import {GuildMember, Role, TextChannel, User} from "discord.js";
import {MafiaPlayer} from "./setup";
import {Abilities} from "./libs/abilities.lib";
import {Action} from "./commands/actions";

export enum Status {NONE = '', SIGNUPS = 'signups', PROGRESS = 'in progress'}
export enum Phase {NONE = '', DAY = 'day', NIGHT = 'night', DUSK = 'dusk'}
export class GamePhase {
    phase: Phase;
    number: number;
    constructor(phase: Phase, number: number) {
        this.phase = phase;
        this.number = number;
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
        votes.forEach(vote => {
            const existingEntry = this.entries.find(entry => entry.votee === vote.votee);
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
class VotecountEntry {
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

export let players: Player[] = [];
export let votes: Vote[] = [];
export let playerrole: Role;
export let channel: TextChannel;

export function isGameInSignups () : boolean {
    return gameStatus === Status.SIGNUPS;
}
export function isGameInProgress () : boolean {
    return gameStatus === Status.PROGRESS;
}
export async function setGameInSignups () : Promise<void> {
    gameStatus = Status.SIGNUPS;
}
export async function setGameInProgress (startPhase: Phase) : Promise<void> {
    gameStatus = Status.PROGRESS;
    if (startPhase === Phase.DAY) {
        gamePhase = new GamePhase(Phase.NIGHT, 0);
    } else {
        gamePhase = new GamePhase(Phase.DAY, 0);
    }
    await advancePhase();
}
export function isDay () : boolean {
    return gamePhase.phase === Phase.DAY;
}
export function isNight () : boolean {
    return gamePhase.phase === Phase.NIGHT;
}
export function isDusk () : boolean {
    return gamePhase.phase === Phase.DUSK;
}
export function isDuskAwaitingPlayer (user: User) : boolean {
    return duskAwaitingPlayer.user === user;
}
export async function advancePhase () : Promise<void> {
    if (!isGameInProgress()) {
        return;
    }
    resetVotes();
    duskAwaitingPlayer = null;
    if (isNight()) {
        await actions.resolveActions();
        gamePhase.phase = Phase.DAY;
        gamePhase.number += 1;
        channel.send(`It is now day ${gamePhase.number}. With ${players.filter(player => player.mafia.alive).length} alive, it takes ${getLynchThreshold()} to lynch.`);
        await Core.unmute(channel);
    } else {
        gamePhase.phase = Phase.NIGHT;
        channel.send(`It is now night ${gamePhase.number}. Send in your actions!`);
        await Core.mute(channel);
    }
}

export async function startGame (startPhase: Phase) : Promise<void> {
    channel.send(`The game is afoot!`);
    channel.send(`Players: ${players.map(player => Core.findUserMention(channel, player.displayName)).join(', ')}`);
    await setGameInProgress(startPhase);
}

export function getLynchThreshold () : number {
    return Math.floor(players.filter(player => player.mafia.alive).length / 2 + 1);
}

export function getVotecount () : Votecount {
    return new Votecount(votes);
}

function resetVotes () : void {
    players.forEach(player => votes.push(new Vote(player, '')));
}

export async function checkForLynch () : Promise<void> {
    const vc = getVotecount();
    const lynchThreshold = getLynchThreshold();
    for (let entry of vc.entries) {
        if (entry.voters.length >= lynchThreshold && entry.votee) {
            await lynchPlayer(entry.votee);
            break;
        }
    }
}

export async function lynchPlayer (user: string) : Promise<void> {
    await commands.voteCount(channel);
    channel.send(`A majority vote has been achieved!`);
    if (user === 'No Lynch') {
        channel.send(`Nobody was lynched!`);
        await advancePhase();
    } else {
        const lynchee = players.find(player => player.displayName === user);
        await playerDeath(lynchee, 'has been lynched');

        const onLynch = lynchee.mafia.role.status.onlynch;
        if (onLynch) {
            await onLynchSwitch(onLynch, lynchee);
        }

        const deadRole = lynchee.mafia.role.truename || lynchee.mafia.role.name;
        const playersWithRoleLynchTrigger = players.filter(player => player.mafia.role.status.onrolelynch);
        for (const player of playersWithRoleLynchTrigger) {
            const onrolelynch = player.mafia.role.status.onrolelynch;
            await checkOnDeathTriggers(onrolelynch, deadRole, player);
        }

        await checkForEndgame();
        await advancePhase();
    }
}

async function onLynchSwitch (onLynch: string, lynchee: GuildMember) : Promise<void> {
    if (onLynch === 'supersaint') {
        const votecount = getVotecount();
        const voters = votecount.entries.find(entry => entry.votee === lynchee.displayName).voters;
        const hammerer = voters[voters.length - 1];
        if (lynchee !== hammerer) {
            const playerToKill = players.find(player => player === hammerer);
            await killPlayer(playerToKill);
        }
    }
}

export async function addPlayer (user: GuildMember) : Promise<void> {
    const player = user as Player;
    players.push(player);
    await user.addRole(playerrole);
}

export async function removePlayer (user: GuildMember) : Promise<void> {
    players.splice(players.indexOf(user as Player), 1);
    await user.removeRole(playerrole);
}

export async function killPlayer (user: Player, killedString: string = 'was killed') : Promise<void> {
    await playerDeath(user, killedString);
    await checkForOnRoleKill(user);
    await checkForEndgame();
}

async function checkForOnRoleKill (user: Player) : Promise<void> {
    const deadRole = user.mafia.role.truename || user.mafia.role.name;
    const playersWithRoleKillTrigger = players.filter(player => player.mafia.role.status.onrolekill);
    for (const player of playersWithRoleKillTrigger) {
        const onrolekill = player.mafia.role.status.onrolekill;
        await checkOnDeathTriggers(onrolekill, deadRole, player);
    }
}

export async function checkForEndgame () : Promise<void> {
    console.log('checking for endgame...');
    if (!isGameInProgress()) {
        return;
    }

    const livingPlayers = players.filter(player => player.mafia.alive);
    const livingMafia = livingPlayers.filter(player => player.mafia.team.name === 'mafia');
    const livingTown = livingPlayers.filter(player => player.mafia.team.name === 'town');
    let winningTeam, winningPlayers;

    if (livingTown.length === livingPlayers.length) {
        winningTeam = 'town';
        winningPlayers = getWinningPlayers('town');
    } else if (livingMafia.length >= livingPlayers.length / 2) {
        winningTeam = 'mafia';
        winningPlayers = getWinningPlayers('mafia');
    }

    if (winningTeam) {
        await triggerEndGame(winningTeam, winningPlayers);
    }
}

export async function endGame () : Promise<void> {
    players.forEach(async player => {
        if (player.roles.some(role => role === playerrole)) {
            await player.removeRole(playerrole);
        }
    });
    players = [];
    votes = [];
    gameStatus = Status.NONE;
    gamePhase.phase = Phase.NONE;
    await Core.unmute(channel);
}

async function triggerEndGame (winningTeam: string, winningPlayers: string) : Promise<void> {
    channel.send(`Game Over! The ${winningTeam} wins! \:tada:`);
    channel.send(`Winners: ${winningPlayers}`);
    const playerString = players
        .map(player => `${player.displayName} (${player.mafia.role.truename || player.mafia.role.name})`)
        .join(', ');
    channel.send(`Players: ${playerString}`);
    await endGame();
}

async function playerDeath (user: Player, killedString: string) : Promise<void> {
    channel.send(`${user.displayName} ${killedString}! They were a ${user.mafia.role.name} (${user.mafia.team.name}).`);

    const ghostAction = user.mafia.role.status.ghostaction;
    if (ghostAction) {
        gamePhase.phase = Phase.DUSK;
        duskAwaitingPlayer = user;
        await Core.mute(channel);

        const giveability = Abilities.get('giveability') as Action;
        giveability.victims = [user];
        if (!user.mafia.role.status.gifts) {
            user.mafia.role.status.gifts = [];
        }
        user.mafia.role.status.gifts.push(ghostAction);
        giveability.actioner = user;
        await actions.giveability(giveability);

        channel.send(`Waiting for ${user.displayName} to submit a ${ghostAction}...`);
        await Core.waitWithCheck(() => !isDusk());
        await checkForEndgame();
    }

    console.log('removing player ' + user.displayName);
    await user.removeRole(playerrole);
    user.mafia.alive = false;

    const deadRole = user.mafia.role.truename || user.mafia.role.name;
    const playersWithRoleDeathTrigger = players.filter(player => player.mafia.role.status.onroledeath);
    for (const player of playersWithRoleDeathTrigger) {
        const onroledeath = player.mafia.role.status.onroledeath;
        await checkOnDeathTriggers(onroledeath, deadRole, player);
    }
}

async function checkOnDeathTriggers (onRoleDeathTrigger: string, deadRole: string, player: Player) : Promise<void> {
    const trigger = onRoleDeathTrigger.split(':');

    const triggeringRole = trigger[0];
    if (deadRole !== triggeringRole) {
        return;
    }

    if (trigger.includes('win')) {
        let winningTeam = player.mafia.team.name;
        const winningPlayers = getWinningPlayers(winningTeam);
        await triggerEndGame(winningTeam, winningPlayers);
    } else if (trigger.includes('action')) {
        const actionFn = await actions.deduceActionFromRole(`${trigger[1]}:${trigger[2]}`, player);
        await actionFn();
    }
}

function getWinningPlayers (team: string) : string {
    return players
        .filter(player => player.mafia.team.name === team)
        .map(player => `${player.displayName}`)
        .join(', ');
}
