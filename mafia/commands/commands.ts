import config = require('../libs/config.json');
import setup = require('../setup');
import state = require('../game-state');
import {GuildMember, Message, TextChannel, User} from "discord.js";
import {moderatorSetupMessage, Vote, setModeratorMessage} from "../game-state";
import {MafiaPlayer, MafiaSetup, fetchAllSetups} from "../libs/setups.lib";
import {Core} from "../../core/core";
import {Permissions} from "../../core/permissions";
import {MafiaRole, MafiaStatus} from "../libs/roles.lib";
import {Factions} from "../libs/factions.lib";
import {currentSetup, getSetupAsEmbed} from "../setup";

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
    }

    setup.rolesOnly = setup.currentSetup.unimplemented || (args[1] && args[1] === 'roles');

    const minplayers = setup.currentSetup.minplayers || config.minimum_players;
    const maxplayers = setup.currentSetup.maxplayers || config.maximum_players;
    const allowedPlayerCount = maxplayers ? maxplayers === minplayers ? `${minplayers}` : `${minplayers} - ${maxplayers}` : `${minplayers}+`;

    let timer = config.start_time;
    state.playerrole = channel.guild.roles.find(role => role.name === config.player_role);

    if (setupName === 'moderated') {
        state.moderator = user.user;
        channel.send(
            `Starting a game of Mafia [moderated by ${user.displayName}]. Type "!in" to sign up.`
        );
        setModeratorMessage(await user.send('Use `addrole [town|mafia|sk] "[rolename]" "[roletext]"` and `removerole "[rolename]"` to configure your setup.') as Message);
        Core.waitWithCheck(() => !state.isGameInSignups(), 10, 7200).then(async (isFulfilled) => {
            if (!isFulfilled) {
                channel.send(`Sorry ${user.displayName}, your moderated game timed out after two hours.`);
                await abortGame(channel);
            }
        });
    } else {
        channel.send(
            `Starting a game of Mafia [${setupName} for ${allowedPlayerCount} players${setup.rolesOnly ? ', roles only' : ''}] in ${timer / 60} minutes. Type "!in" to sign up.`
        );
        Core.waitWithCheck(() => state.isGameInProgress() || state.isGameOver(), 5, 300).then(async (isFulfilled) => {
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
    if (currentSetup.maxplayers && state.players.length >= currentSetup.maxplayers) {
        channel.send(`Sorry ${user.displayName}, the game is full!`);
        return;
    }

    await state.addPlayer(user);
    channel.send(`You are now signed up for the next game, ${user.displayName}.`);
    // problem with multiple people inning at once... it takes too long to init the setup... commenting this out til i figure out a fix
    // if (currentSetup.maxplayers && state.players.length === currentSetup.maxplayers) {
    //     await beginGame(channel);
    // }
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

export async function players (channel: TextChannel) : Promise<void> {
    channel.send(`Players: ${state.players.map(player => Core.findUserMention(channel, player.displayName)).join(', ')}`);
}

export async function spoilers (channel: TextChannel, user: GuildMember) : Promise<void> {
    if (state.lastPlayedPlayers && !state.players.find(player => player.displayName === user.displayName && player.mafia.alive)) {
        const playerList = state.lastPlayedPlayers.map(player => `${player.displayName} - ${player.mafia.role.name} (${player.mafia.team.name})`);
        user.send(playerList.join(', '));
    }
}

export async function beginGame (channel: TextChannel) : Promise<void> {
    if (state.isGameInSignups()) {
        if (currentSetup.minplayers && state.players.length < currentSetup.minplayers) {
            channel.send(`You should probably wait for at least ${currentSetup.minplayers} to be signed up before trying to start the game.`);
            return;
        }
        state.channel = channel;
        await setup.initializeSetup();
        await state.startGame();
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
        setups = fetchAllSetups();
    } else if (Permissions.isHop(user) && arg === 'hidden') {
        setups = fetchAllSetups(true);
    } else if (arg === 'unimplemented') {
        setups = fetchAllSetups(false, true);
    } else if (Permissions.isHop(user) && arg === 'all') {
        setups = fetchAllSetups(true, true);
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
    setModeratorMessage(await moderatorSetupMessage.edit(getSetupAsEmbed()));
}

export async function removeRole(user: User, args: string[]) : Promise<void> {
    if (!isModerator(user)) {
        return;
    }

    const removeRoleName = args[0];
    const currentRoles = setup.currentSetup.fixedSetups.setups[0].setup;
    const roleToRemove = currentRoles.find(role => role.role.name.toLowerCase() === removeRoleName.toLowerCase());
    if (!roleToRemove) {
        user.send('Please use the format `removerole "[rolename]"`');
        return;
    }

    currentRoles.splice(currentRoles.indexOf(roleToRemove), 1);
    setModeratorMessage(await moderatorSetupMessage.edit(getSetupAsEmbed()));
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
