import {authorize} from "../core/auth";

const http = require('http');
const https = require('https');
const fs = require('fs');
const ws = require('ws');
import {getHtmlPage} from './http.html';

import * as Express from 'express';
const favicon = require('serve-favicon');
import {checkForLynch, getVotecount, Player, resetVotes} from "../mafia/game-state";
import {vote} from "../mafia/commands/commands";
import {TextChannel} from "discord.js";
import {logger} from "../logger";
const app = Express();

const certPath = '/etc/letsencrypt/live/mafbot.mafia451.com/';
const cert = fs.readFileSync(`${certPath}fullchain.pem`, 'utf8');
const key = fs.readFileSync(`${certPath}privkey.pem`, 'utf8');

const adminIds = ['135782754267693056', '127862334893850624', '343523759610789908', '339494032331767809'];

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
let livingPlayers = [] as Player[];
let formal: string;

socketServer.on('connection', socket => {
    socket.send(JSON.stringify({ path: 'players', players: mapToSimplePlayers(livingPlayers) }));
    if (formal) {
        socket.send(JSON.stringify({ path: 'formal', username: formal }));
    }

    socket.on('message', message => {
        console.log(`message received: ${message}`);
        const json = JSON.parse(message);
        switch (json.path) {
            case 'vote':
                const voter = livingPlayers.find(p => p.id === json.userid);
                vote({} as TextChannel, voter, [formal]);
                break;
            case 'formal':
                if (!adminIds.find(id => json.userid === id)) {
                    return;
                }
                formal = json.username;
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'formal', username: formal })));
                break;
            case 'reveal':
                if (!adminIds.find(id => json.userid === id)) {
                    return;
                }
                formal = null;
                const votecount = getVotecount();
                const voters = votecount.entries[0].voters.map(v => v.displayName);
                checkForLynch();
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'reveal', votes: voters })));
                break;
            case 'clear':
                if (!adminIds.find(id => json.userid === id)) {
                    return;
                }
                formal = null;
                resetVotes();
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'clear' })));
                break;
        }
    });

    socket.on('error', (sock, err) => {
        logger.error(err);
    })
});

socketServer.on('error', (sock, err) => {
    logger.error(err);
});

export function httpUpdateLivingPlayers (players: Player[]) : void {
    livingPlayers = players;
    const simplePlayers = mapToSimplePlayers(players);
    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'players', players: simplePlayers })));
}

function mapToSimplePlayers (players: Player[]) : SimplePlayer[] {
    return players.map(p => { return { id: p.id, name: p.displayName }});
}

class SimplePlayer {
    id: string;
    name: string;
}
