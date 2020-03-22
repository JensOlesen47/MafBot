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
    getVotecount,
    isGameInProgress,
    Player,
    resetVotes,
    VotecountEntry
} from "../mafia/game-state";
import {modkill, vote} from "../mafia/commands/commands";
import {TextChannel, User} from "discord.js";
import {logger} from "../logger";
const app = Express();

const certPath = '/etc/letsencrypt/live/mafbot.mafia451.com/';
const cert = fs.readFileSync(`${certPath}fullchain.pem`, 'utf8');
const key = fs.readFileSync(`${certPath}privkey.pem`, 'utf8');



app.use(favicon('./http/favicon.ico'));

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

const httpsServer = https.createServer({ key, cert }, app).listen(443, () => console.log('http server ready!'));

http.createServer(((req, res) => {
    res.writeHead(301, { 'Location': `https://mafbot.mafia451.com${req.url}` });
    res.end();
})).listen(80);

const socketServer = new ws.Server({server: httpsServer});
let players = [] as Player[];
let formal: string;
let formalHistory = [] as VotecountEntry[];

socketServer.on('connection', (socket, req) => {
    const ip = req.connection.remoteAddress;

    socket.send(JSON.stringify({ path: 'players', players: players.map(mapToSimplePlayer) }));
    socket.send(JSON.stringify({ path: 'history', formals: formalHistory.map(mapToSimpleFormal) }));
    if (formal) {
        socket.send(JSON.stringify({ path: 'formal', username: formal }));
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
            case 'formal':
                if (!isAdmin(json.from.userid) || formal) {
                    return;
                }
                resetVotes();
                formal = json.username;
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'formal', username: formal })));
                break;
            case 'reveal':
                if (!isAdmin(json.from.userid) || !formal) {
                    return;
                }
                formal = null;
                const votecount = getVotecount();
                const voters = votecount.entries[0].voters.map(v => v.displayName);
                checkForLynch();
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'reveal', votes: voters })));
                break;
            case 'clear':
                if (!isAdmin(json.from.userid)) {
                    return;
                }
                formal = null;
                resetVotes();
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'clear' })));
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

export function httpUpdateLivingPlayers (playersUpate: Player[]) : void {
    logger.debug(`http-update for living players : ${playersUpate.map(p => `${p.displayName} = ${p.mafia.alive}`)}`);
    players = playersUpate;
    const simplePlayers = playersUpate.map(mapToSimplePlayer);
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'players', players: simplePlayers })));

    if (!players.length) {
        formalHistory = [];
        socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'history', formals: formalHistory.map(mapToSimpleFormal) })));
    }
}

export function recordVoteHistory (votecountEntry: VotecountEntry) : void {
    logger.debug(`recording formal on player : ${votecountEntry.votee}`);
    formalHistory.push(votecountEntry);
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'history', formals: formalHistory.map(mapToSimpleFormal) })));
}

function mapToSimplePlayer (player: Player) : SimplePlayer {
    return { id: player.id, name: player.displayName, alive: player.mafia.alive, team: player.mafia.alive ? null : player.mafia.team.name };
}

function mapToSimpleFormal (votecountEntry: VotecountEntry) : SimpleVotecountEntry {
    return {
        votee: mapToSimplePlayer(players.find(p => p.displayName === votecountEntry.votee)),
        voters: votecountEntry.voters.map(v => mapToSimplePlayer(players.find(p => v.id === p.id)))
    }
}

function isAdmin (userId: string) : boolean {
    const adminIds = ['135782754267693056', '127862334893850624', '343523759610789908', '339494032331767809'];
    return adminIds.includes(userId);
}

class SimplePlayer {
    id: string;
    name: string;
    alive: boolean;
    team: string;
}

class SimpleVotecountEntry {
    votee: SimplePlayer;
    voters: SimplePlayer[];
}
