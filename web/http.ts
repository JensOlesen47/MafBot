import {authorize} from "../core/auth";

const http = require('http');
const https = require('https');
const fs = require('fs');
const ws = require('ws');
import {getHtmlPage} from './http.html';

import * as Express from 'express';
const favicon = require('serve-favicon');
import {
    checkForLynch,
    GamePhase,
    getVotecount,
    isGameInProgress,
    Player,
    resetVotes,
    VotecountEntry
} from "../mafia/game-state";
import {beginGame, modkill, playerIn, unvote, vote} from "../mafia/commands/commands";
import {TextChannel, User} from "discord.js";
import {logger} from "../logger";
import {mafbot} from "../bot/bot";
const app = Express();

const certPath = '/etc/letsencrypt/live/mafbot.mafia451.com/';
const cert = fs.readFileSync(`${certPath}fullchain.pem`, 'utf8');
const key = fs.readFileSync(`${certPath}privkey.pem`, 'utf8');
app.use(Express.static('./web/static', { dotfiles: 'allow' }));

app.use(favicon('./web/favicon.ico'));

app.get('/', (req, res) => {
    const htmlPage = getHtmlPage('index');
    res.status(200).send(htmlPage);
});

app.get('/vote', (req, res) => {
    const htmlPage = getHtmlPage('vote');
    res.status(200).send(htmlPage);
});

app.get('/login', (req, res) => {
    res.status(301).header('Location', 'https://discordapp.com/api/oauth2/authorize?client_id=487077607427276810&redirect_uri=https%3A%2F%2Fmafbot.mafia451.com%2Fauthenticate&response_type=code&scope=identify%20guilds.join&prompt=none').send();
});

app.get('/authenticate', (req, res) => {
    const code = req.url.split('?code=')[1];

    if (code) {
        authorize(code).then(user => {
            const htmlPage = getHtmlPage('registration-confirmed', {username: user.username, userId: user.id});
            console.log(`saved creds for new user: ${user.username}`);
            beginGame({ send: () => {} } as TextChannel);
            res.status(200).send(htmlPage);
        });
    } else {
        console.log(`user denied auth request`);
        res.status(200).send(`That isn't very helpful, I kinda need you to auth with me to work properly.`);
    }
});

app.get('*', (req, res) => {
    const htmlPage = getHtmlPage('not-found');
    res.status(200).send(htmlPage);
});

const httpsServer = https.createServer({ key, cert }, app).listen(8443, () => console.log('web server ready!'));

http.createServer(((req, res) => {
    res.writeHead(301, { 'Location': `https://mafbot.mafia451.com${req.url}` });
    res.end();
})).listen(8080);

const socketServer = new ws.Server({server: httpsServer, path: '/ws'});
let players = [] as Player[];
let formal: string;
let formalHistory = [] as VotecountEntry[];
let messages = [] as string[];
let phase: GamePhase;

socketServer.on('connection', (socket, req) => {
    const ip = req.connection.remoteAddress;

    socket.send(JSON.stringify({ path: 'players', players: players.map(mapToSimplePlayer) }));
    socket.send(JSON.stringify({ path: 'histories', formals: formalHistory.map(mapToSimpleFormal) }));
    socket.send(JSON.stringify({ path: 'logs', logs: messages }));
    if (formal) {
        socket.send(JSON.stringify({ path: 'formals', username: formal }));
    }
    if (phase) {
        socket.send(JSON.stringify({ path: 'phases', phase: phase }));
    }

    socket.on('message', (message) => {
        logger.silly(`websocket message received: ${message}`);
        if (!isGameInProgress()) {
            logger.debug(`Ignoring websocket message: no game in progress`);
            return;
        }
        const json = JSON.parse(message);
        switch (json.path) {
            case 'vote':
                const voter = players.find(p => p.id === json.from.userid);
                vote({} as TextChannel, voter, [formal]);
                break;
            case 'unvote':
                const unvoter = players.find(p => p.id === json.from.userid);
                unvote({} as TextChannel, unvoter);
                break;
            case 'in':
                mafbot.fetchUser(json.from.userid, true).then(user => {
                    const channel = { send: msg => webSendMessage(msg) } as TextChannel;
                    const guildMember = mafbot.guilds.find(g => g.id === channel.guild.id).member(user);
                    playerIn(channel, guildMember);
                });
                break;
            case 'formal':
                if (!isAdmin(json.from.userid) || formal) {
                    return;
                }
                resetVotes();
                formal = json.username;
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'formals', username: formal })));
                break;
            case 'reveal':
                if (!isAdmin(json.from.userid) || !formal) {
                    return;
                }
                const votecount = getVotecount();
                const votecountEntry = votecount.entries.find(e => e.votee === formal);
                const voters = votecountEntry ? votecountEntry.voters.map(v => v.displayName) : [];
                checkForLynch(formal);
                formal = null;
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'reveals', votes: voters })));
                break;
            case 'clear':
                if (!isAdmin(json.from.userid)) {
                    return;
                }
                formal = null;
                resetVotes();
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'clears' })));
                break;
            case 'modkill':
                if (!isAdmin(json.from.userid)) {
                    return;
                }
                modkill({} as User, [ json.username ]);
                break;
        }
    });

    socket.on('error', (err) => {
        logger.error(err);
    });

    logger.debug(`Opened ws connection at ${ip}`);
    socket.on('close', () => {
        logger.debug(`Closed ws connection at ${ip}`);
    });
});

socketServer.on('error', (err) => {
    logger.error(err);
});

export function webUpdateLivingPlayers (playersUpate: Player[], deadPlayer?: Player, killedString?: string) : void {
    logger.debug(`http-update for living players : ${playersUpate.map(p => `${p.displayName} = ${p.mafia.alive}`)}`);
    players = playersUpate;
    const simplePlayers = playersUpate.map(mapToSimplePlayer);
    if (deadPlayer) {
        sendDeathMessage(deadPlayer, killedString);
    }
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'players', players: simplePlayers })));
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'histories', formals: formalHistory.map(mapToSimpleFormal) })));

    if (players.every(p => p.mafia && !p.mafia.alive)) {
        players = [];
        formalHistory = [];
        messages = [];
        formal = null;
        phase = null;
    }
}

export function webRecordVoteHistory (votecountEntry: VotecountEntry) : void {
    logger.debug(`recording formal on player : ${votecountEntry.votee}`);
    formalHistory.push(votecountEntry);
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'histories', formals: formalHistory.map(mapToSimpleFormal) })));
}

export function webSendMessage (message: string) : void {
    logger.debug(`Sending message to web clients : ${message}`);
    messages.unshift(message);
    // socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'logs', logs: messages })));
}

export function webUpdatePhase (newPhase: GamePhase) : void {
    logger.debug(`Updating web game phase : ${newPhase.toString()}`);
    phase = newPhase;
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'phases', phase: phase })));
}

function sendDeathMessage (player: Player, killedString: string) : void {
    const message = {
        username: player.displayName,
        team: player.mafia.team.name,
        method: killedString.includes('lynch') ? 'lynch' : 'kill'
    };
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'deaths', death: message })));
}

function mapToSimplePlayer (player: Player) : SimplePlayer {
    return {
        id: player.id,
        username: player.displayName,
        alive: player.mafia && player.mafia.alive,
        team: !player.mafia || player.mafia.alive ? null : player.mafia.team.name
    };
}

function mapToSimpleFormal (votecountEntry: VotecountEntry) : SimpleVotecountEntry {
    return {
        votee: mapToSimplePlayer(players.find(p => p.displayName === votecountEntry.votee)),
        voters: votecountEntry.voters.map(v => mapToSimplePlayer(players.find(p => v.id === p.id)))
    }
}

function isAdmin (userId: string) : boolean {
    const adminIds = ['135782754267693056', '127862334893850624', '343523759610789908', '339494032331767809', '356163154067193856'];
    return adminIds.includes(userId);
}

class SimplePlayer {
    id: string;
    username: string;
    alive: boolean;
    team: string;
}

class SimpleVotecountEntry {
    votee: SimplePlayer;
    voters: SimplePlayer[];
}
