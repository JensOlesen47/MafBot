import config = require('../libs/config.json');
import setup = require('../setup');
import state = require('../game-state');
import {GuildMember, Message, RichEmbed, TextChannel, User} from "discord.js";
import {moderatorSetupMessage, Vote, setModeratorMessage} from "../game-state";
import {MafiaPlayer} from "../libs/setups.lib";
import {Core} from "../../core/core";
import {Permissions} from "../../core/permissions";
import {MafiaRole, MafiaStatus} from "../libs/roles.lib";
import {Factions} from "../libs/factions.lib";
import {currentSetup, getSetupAsEmbed} from "../setup";
import {getHistory, updateHistoryUserDeath, updateHistoryWinners} from "../../core/db/history";
import {History} from "../../core/db/types";
import moment = require("moment");
import {Help} from "../../core/help";
import {mafbot} from "../../bot";
import {addUserToGuild, cleanupGuilds} from "../private-chat";
import {checkUserAuthorization, getAccessTokenForUser} from "../../core/auth";
import { getTokens } from '../../core/db/user-token.js';

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

    setup.video = setup.currentSetup.unimplemented || ['roles', 'vm', 'video'].includes(args[1]);

    const minplayers = setup.currentSetup.minplayers || config.minimum_players;
    const maxplayers = setup.currentSetup.maxplayers || config.maximum_players;
    const allowedPlayerCount = maxplayers ? maxplayers === minplayers ? `${minplayers}` : `${minplayers} - ${maxplayers}` : `${minplayers}+`;

    let timer = config.start_time;
    state.playerrole = channel.guild.roles.find(role => role.name === config.player_role);

    if (setupName === 'moderated') {
        state.moderator = user.user;
        channel.send(
            `Starting a game of Mafia [moderated by ${user.displayName}]. Type \`!in\` to sign up.`
        );
        setModeratorMessage(await user.send(getSetupAsEmbed()) as Message);
        Core.waitWithCheck(() => !state.isGameInSignups(), 10, 7200).then(async (isFulfilled) => {
            if (!isFulfilled) {
                channel.send(`Sorry ${user.displayName}, your moderated game timed out after two hours.`);
                await abortGame(channel);
            }
        });
    } else {
        channel.send(
            `Starting a game of ${setup.video ? 'Video ' : ''}Mafia [${setupName} for ${allowedPlayerCount} players] in ${timer / 60} minutes. Type \`!in\` to sign up.`
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
    const BANNED_NAMES = ['none', 'nolynch', 'self', 'sky', 'unknown', 'mafia', 'town', 'sk', 'assassin', 'lyncher', 'jester'];
    if (BANNED_NAMES.includes(user.displayName.toLowerCase())) {
        channel.send(`That's sooooooo funny. You're gonna mess stuff up if you join a game with that nickname, ${user.displayName}.`);
        return;
    }
    if (currentSetup.maxplayers && state.players.length >= currentSetup.maxplayers) {
        channel.send(`Sorry ${user.displayName}, the game is full!`);
        return;
    }

    await state.addPlayer(user);
    channel.send(`You are now signed up for the next game, ${user.displayName}.`);
    await checkUserAuthorization(user.user);
    // problem with multiple people inning at once... it takes too long to init the setup... commenting this out til i figure out a fix
    // but maybe it isn't a problem?? maybe i'll uncomment it anyway and see what happen????
    if (currentSetup.maxplayers && state.players.length === currentSetup.maxplayers) {
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

export async function players (channel: TextChannel) : Promise<void> {
    channel.send(`Players (${state.players.length}): ${state.players.map(player => Core.findUserMention(channel, player.displayName)).join(', ')}`);
}

export async function publicHistory (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
    return await history(user.user, args);
}

export async function spoilers (channel: TextChannel, user: GuildMember) : Promise<void> {
    await history(user.user, ['last']);
    const accessToken = await getAccessTokenForUser(user.id);
    if (accessToken) {
        mafbot.guilds.filter(guild => guild.name.startsWith('MafBot ~ '))
            .forEach(guild => addUserToGuild(user.user, `${user.displayName} (Spectator)`, guild, accessToken));
    }
}

export async function history (user: User, args: string[]) : Promise<void> {
    if (!args || args.length === 0) {
        args = ['summary'];
    }
    const arg1 = args.splice(0, 1)[0];

    if (args.length === 0) {
        if (arg1 === 'last') {
            const embed = await getFullHistoryEmbed(await getHistory(1), true);
            user.send(embed);
            return;
        }
        if (/^\d+$/.test(arg1)) {
            const embed = await getFullHistoryEmbed(await getHistory(1, Number(arg1)), false);
            user.send(embed);
            return;
        }
        if (arg1 === 'summary') {
            const embed = await getSummaryHistoryEmbed(await getHistory(25), 'Summary: last 25 games');
            user.send(embed);
            return;
        }
        const date = moment(arg1, 'DD-MM-YYYY');
        if (date.isValid()) {

        }
    } else if ((arg1 === 'last' || /^\d+$/.test(arg1)) && args[1]) {
        const gameId = arg1 === 'last' ? null : Number(arg1);

        if (args[0] === 'winners') {
            let winningTeam = args[1];
            if (winningTeam === 't' || winningTeam === 'town') {
                winningTeam = 'town';
            } else if (winningTeam === 'm' || winningTeam === 'mafia') {
                winningTeam = 'mafia';
            } else if (!Factions.get(winningTeam)) {
                user.send(`It looks like '${winningTeam}' isn't the name of a team. Is it spelled correctly?`);
                return;
            }
            await updateHistoryWinners(winningTeam, gameId);
            await user.send(`Change confirmed, ${winningTeam} won that game.`);
            await history(user, [gameId ? String(gameId) : 'last']);
            return;
        }

        let userId: string;
        const gameRecord = await getHistory(1, gameId);
        let userRecord: GuildMember;
        let userHistory = gameRecord.find(record => record.username.toLowerCase() === args[0]);
        if (!userHistory) {
            userHistory = gameRecord.find(record => record.username.toLowerCase().startsWith(args[0]));
        }
        if (userHistory) {
            userId = userHistory.userid;
        } else {
            const guildId = gameRecord[0].guildid;
            const guild = mafbot.guilds.find(g => g.id === guildId);
            userRecord = guild.members.find(member => member.displayName.toLowerCase() === args[0]);
            if (!userRecord) {
                userRecord = guild.members.find(member => member.displayName.toLowerCase().startsWith(args[0]));
            }
            if (userRecord) {
                userId = userRecord.id;
            } else {
                user.send(`I couldn't find any user by the name of '${args[0]}' in the ${guild.name} server.`);
                return;
            }
        }
        if (gameRecord.find(record => record.userid === userId)) {
            let unparsedDeath = args[1];
            if (/^(lynched|l|killed|k)(day|d|night|n)\d+$/.test(unparsedDeath)) {
                let death, phase, cycle;
                if (unparsedDeath.startsWith('l')) {
                    death = 'lynched';
                    unparsedDeath = unparsedDeath.startsWith('lynched') ? unparsedDeath.substring(7) : unparsedDeath.substring(1);
                } else if (unparsedDeath.startsWith('k')) {
                    death = 'killed';
                    unparsedDeath = unparsedDeath.startsWith('killed') ? unparsedDeath.substring(6) : unparsedDeath.substring(1);
                }
                if (unparsedDeath.startsWith('d')) {
                    phase = 'day';
                    unparsedDeath = unparsedDeath.startsWith('day') ? unparsedDeath.substring(3) : unparsedDeath.substring(1);
                } else if (unparsedDeath.startsWith('n')) {
                    phase = 'night';
                    unparsedDeath = unparsedDeath.startsWith('night') ? unparsedDeath.substring(5) : unparsedDeath.substring(1);
                }
                cycle = unparsedDeath;
                if (death && phase && cycle) {
                    const parsedDeath = `${death} ${phase} ${cycle}`;
                    await updateHistoryUserDeath(userId, parsedDeath, gameId);
                    await user.send(`Change confirmed, ${userHistory ? userHistory.username : userRecord.displayName} was ${parsedDeath}.`);
                    await history(user, [gameId ? String(gameId) : 'last']);
                    return;
                }
            } else {
                user.send(`You screwed up your death method string. It should be something like \`lynchedday1\` or \`kn2\`, but you sent '${args[1]}'.`);
                return;
            }
        } else {
            user.send(`It looks like ${userHistory ? userHistory.username : userRecord.displayName} didn't play in that game. If that's wrong then I give you permission to yell at Urist.`);
            return;
        }
    }

    await Help.history(user);
}

async function getSummaryHistoryEmbed (history: History[], title: string) : Promise<RichEmbed> {
    let gameNum = 0;
    let game = [] as History[];
    let embed = new RichEmbed().setTitle(title);

    for (const user_history of history) {
        if (!gameNum) {
            gameNum = user_history.id;
        } else if (user_history.id !== gameNum) {
            addField(embed, game);
            game = [];
            gameNum = user_history.id;
        }
        game.push(user_history);
    }
    addField(embed, game);

    return embed;

    function addField (embed: RichEmbed, game: History[]) : void {
        const gameNumber = `Game ${game[0].id}`;
        const timestamp = Core.getFormattedTime(game[0].timestamp);
        const setupName = `${game.length}p ${game[0].setupname}`;
        const winningTeam = game[0].winningteam ? ` - ${game[0].winningteam} win` : ``;
        const setupTitle = `${gameNumber} (${timestamp})\n${setupName}${winningTeam}`;
        const players = game
            .sort((a, b) => a.team > b.team ? 1 : a.team < b.team ? -1 : a.role > b.role ? 1 : -1)
            .map(player => `${Core.findUserDisplayNameById(player.guildid, player.userid) || player.username} (${player.team} ${player.role})`)
            .join('\n');
        embed.addField(setupTitle, players);
    }
}

async function getFullHistoryEmbed (history: History[], last: boolean) : Promise<RichEmbed> {
    history.sort((a, b) => a.team > b.team ? 1 : a.team < b.team ? -1 : a.role > b.role ? 1 : -1);

    const timestamp = Core.getFormattedTime(history[0].timestamp);
    const setupName = `${history.length}p ${history[0].setupname}`;
    const gameNumber = `Game ${history[0].id}`;
    const winningTeam = history[0].winningteam ? ` - ${history[0].winningteam} win` : ``;
    const title = last
        ? `Most Recent Game: ${gameNumber} (${timestamp})\n${setupName}${winningTeam}`
        : `${gameNumber} (${timestamp})\n${setupName}${winningTeam}`;
    const embed = new RichEmbed().setTitle(title);

    let lastTeam = '';
    let teamMembers = [] as string[];

    for (const player of history) {
        if (player.team !== lastTeam) {
            if (lastTeam) {
                embed.addField(lastTeam, teamMembers.join('\n'));
            }
            teamMembers = [];
            lastTeam = player.team;
        }
        teamMembers.push(`${Core.findUserDisplayNameById(player.guildid, player.userid) || player.username} (${player.role})${player.won !== null ? ` - ${player.death ? player.death : player.won ? 'survived' : 'endgamed'}` : ''}`);
    }
    embed.addField(lastTeam, teamMembers.join('\n'));
    return embed;
}

export async function beginGame (channel: TextChannel) : Promise<void> {
    if (state.isGameInSignups()) {
        if (currentSetup.minplayers && state.players.length < currentSetup.minplayers) {
            channel.send(`You should probably wait for at least ${currentSetup.minplayers} to be signed up before trying to start the game.`);
            return;
        }
        const userTokens = await getTokens(state.players.map(p => p.id));
        if (userTokens.length < state.players.length) {
            const unauthedPlayers = state.players.filter(player => userTokens.every(token => token.userid !== player.id));
            channel.send(`I REALLY WANTED TO START THE GAME................................. BUT ${unauthedPlayers.map(p => Core.findUserMention(channel, p.displayName)).join(' AND ')} ${unauthedPlayers.length > 1 ? `HAVEN'T` : `HASN'T`} AUTHENTICATED YET. PERHAPS THEY NEED SOME ASSISTANCE????`);
            return;
        }
        state.channel = channel;
        await cleanupGuilds();
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

export async function removeRole (user: User, args: string[]) : Promise<void> {
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

export async function modkill (user: User, args: string[]) : Promise<void> {
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
