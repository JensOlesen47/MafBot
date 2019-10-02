import config = require('../libs/config.json');
import setup = require('../setup');
import state = require('../game-state');
import {GuildMember, TextChannel, User} from "discord.js";
import {Phase, Vote} from "../game-state";
import {MafiaPlayer, MafiaSetup} from "../libs/setups.lib";
import {Core} from "../../core/core";
import {Permissions} from "../../core/permissions";
import {MafiaRole, MafiaStatus} from "../libs/roles.lib";
import {Factions} from "../libs/factions.lib";

let minplayers, maxplayers;

export async function startGame (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
    if (state.isGameInProgress()) {
        channel.send(`There is already a game in progress!`);
        return;
    } else if (state.isGameInSignups()) {
        channel.send(`Signups are already in progress!`);
        return;
    }
    await state.setGameInSignups();

    if (!args[0]) {
        args[0] = `straight`;
    }
    const setupName = args[0];
    setup.setSetup(setupName);
    if (!setup.currentSetup) {
        channel.send(`Sorry ${user.displayName}, ${args[0]} is not a valid setup.`);
        return;
    } else if (setup.currentSetup.unimplemented) {
        channel.send(`Sorry ${user.displayName}, ${args[0]} isn't ready to play yet.`);
        return;
    }

    minplayers = setup.currentSetup.minplayers || config.minimum_players;
    maxplayers = setup.currentSetup.maxplayers || config.maximum_players;
    const allowedPlayerCount = setup.currentSetup.maxplayers ? `${minplayers} - ${maxplayers}` : `${minplayers}+`;

    let timer = config.start_time;
    state.playerrole = channel.guild.roles.find(role => role.name === config.player_role);

    if (setupName === 'moderated') {
        state.moderator = user.user;
        channel.send(
            `Starting a game of Mafia [moderated by ${user.displayName}]. Type "!in" to sign up.`
        );
        Core.waitWithCheck(() => !state.isGameInSignups(), 10, 7200).then(async (isFulfilled) => {
            if (!isFulfilled) {
                channel.send(`Sorry ${user.displayName}, your moderated game timed out after two hours.`);
                await abortGame(channel);
            }
        });
    } else {
        channel.send(
            `Starting a game of Mafia [${setupName} for ${allowedPlayerCount} players] in ${timer / 60} minutes. Type "!in" to sign up.`
        );
        Core.waitWithCheck(() => !state.isGameInSignups(), 5, 300).then(async (isFulfilled) => {
            if (isFulfilled) {
                return;
            }
            if (state.players.length >= minplayers && state.players.length <= maxplayers) {
                await beginGame(channel);
            } else {
                channel.send(`Not enough players signed up.`);
                await abortGame(channel);
            }
        });
    }
}

export async function playerIn (channel: TextChannel, user: GuildMember) : Promise<void> {
    if (!state.isGameInSignups()) {
        channel.send(`Signups are not in progress, ${user.displayName}.`);
        return;
    }
    if (state.players.find(player => player.displayName === user.displayName)) {
        channel.send(`You are already signed up, ${user.displayName}.`);
        return;
    }
    const BANNED_NAMES = ['none', 'nolynch', 'self', 'sky', 'unknown'];
    if (BANNED_NAMES.includes(user.displayName)) {
        channel.send(`You cannot join a game with that nick, ${user.displayName}.`);
        return;
    }
    if (state.players.length >= maxplayers) {
        channel.send(`Sorry ${user.displayName}, the game is full!`);
        return;
    }

    await state.addPlayer(user);
    channel.send(`You are now signed up for the next game, ${user.displayName}.`);
    if (state.players.length === maxplayers) {
        await beginGame(channel);
    }
}

export async function playerOut (channel: TextChannel, user: GuildMember) : Promise<void> {
    if (!state.isGameInSignups()) {
        channel.send(`Signups are not in progress, ${user.displayName}.`);
        return;
    }
    if (!state.players.find(player => player.displayName === user.displayName)) {
        channel.send(`You are not signed up, ${user.displayName}.`);
        return;
    }

    await state.removePlayer(user);
    channel.send(`You are no longer signed up for the next game, ${user.displayName}.`);
}

export async function beginGame (channel: TextChannel) : Promise<void> {
    if (state.isGameInSignups()) {
        state.channel = channel;
        await setup.initializeSetup();
        await state.startGame(setup.currentSetup.start || Phase.NIGHT);
    }
}

export async function abortGame (channel: TextChannel) : Promise<void> {
    channel.send(`Aborting game. \:worried:`);
    await state.endGame();
}

export async function vote (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
    state.votes = state.votes.filter(vote => vote.voter.displayName !== user.displayName);
    let votee: string;

    const vote = args[0];
    if (!vote) {
        votee = '';
    } else if (vote.toLowerCase() === 'nolynch' || vote.toLowerCase() === 'no lynch') {
        votee = 'No Lynch';
    } else {
        const votedPlayer = state.players.find(player => player.displayName.toLowerCase().startsWith(vote.toLowerCase()));
        votee = votedPlayer ? votedPlayer.displayName : '';
    }
    state.votes.push(new Vote(user, votee));
    await state.checkForLynch();
}

export async function unvote (channel: TextChannel, user: GuildMember) : Promise<void> {
    state.votes.find(vote => vote.voter.displayName === user.displayName).votee = '';
}

export async function voteCount (channel: TextChannel) : Promise<void> {
    const vc = state.getVotecount();
    channel.send(`**VOTE COUNT (${state.getLynchThreshold()} to lynch)**`);
    vc.entries.forEach(entry => {
        const votee = `*${entry.votee || 'Not Voting'}* (${entry.voters.length})`;
        const voters = `${entry.voters.map(voter => voter.displayName).join(', ')}`;
        channel.send(`${votee} - ${voters}`);
    });
}

export async function listSetups (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
    const arg = args[0];
    let setups: MafiaSetup[] = [];

    if (!Permissions.isHop(user) || !arg) {
        setups = setup.fetchAllSetups();
    } else if (Permissions.isHop(user) && arg === 'hidden') {
        setups = setup.fetchAllSetups(true);
    } else if (Permissions.isOp(user) && arg === 'unimplemented') {
        setups = setup.fetchAllSetups(false, true);
    } else if (Permissions.isOp(user) && arg === 'all') {
        setups = setup.fetchAllSetups(true, true);
    } else {
        return;
    }

    channel.send(setups.map(i => i.name).sort((a, b) => a > b ? 1 : 0).join(', '));
}

export async function addRole (user: User, args: string[]) : Promise<void> {
    if (!isModerator(user)) {
        return;
    }

    const team = args.shift();
    const roleName = args.shift();
    const roleText = args.shift();
    if (!(team && ['town', 'mafia', 'sk'].includes(team)) || !roleName || !roleText || args.length) {
        user.send('I think you might have made a mistake. Please use the format `addrole [town|mafia|sk] "[rolename]" "[roletext]"` for this command.');
        return;
    }

    const mafiaRole = new MafiaRole(roleName, roleText, [], new MafiaStatus());
    const mafiaTeam = Factions.get(team);
    const mafiaPlayer = new MafiaPlayer(mafiaRole, mafiaTeam);
    setup.currentSetup.fixedSetups.setups[0].setup.push(mafiaPlayer);
    user.send(`Confirmed! Role #${setup.currentSetup.fixedSetups.setups[0].setup.length} is now ${mafiaRole.name} (${mafiaTeam.name})`);
}

export async function removeRole(user: User, args: string[]) : Promise<void> {
    if (!isModerator(user)) {
        return;
    }

    const index = Number(args[0]);
    const currentRoles = setup.currentSetup.fixedSetups.setups[0].setup;
    if (isNaN(index) || index < 1 || index > currentRoles.length) {
        user.send(`Please use the format \`removerole [1-${currentRoles.length}]\``);
        return;
    }

    currentRoles.splice(index, 1);
}

export async function modkill(user: User, args: string[]) : Promise<void> {
    if (!state.isGameInProgress()) {
        user.send(`I can't kill anybody while there are no games in progress.`);
        return;
    }
    const member = state.channel.members.find(member => member.id === user.id);
    if ((member && !Permissions.isHop(member)) && !isModerator(user)) {
        return;
    }

    args.forEach(arg => {
        const player = state.players.find(player => player.displayName.toLowerCase().includes(arg.toLowerCase()));
        if (!player) {
            user.send(`Player '${arg}' was not found.`);
            return;
        }
        state.killPlayer(player, 'was modkilled');
    });
}

function isModerator(user: User) {
    if (user.id !== state.moderator.id) {
        user.send(`You're not moderating any games.`);
        return false;
    }
    return true;
}
