import {authorize} from "../core/auth";

const http = require('http');
const https = require('https');
const fs = require('fs');
const ws = require('ws');
import {getHtmlPage} from './http.html';

import * as Express from 'express';
const app = Express();

const certPath = '/etc/letsencrypt/live/mafbot.mafia451.com/';
const cert = fs.readFileSync(`${certPath}fullchain.pem`, 'utf8');
const key = fs.readFileSync(`${certPath}privkey.pem`, 'utf8');

app.get('/', (req, res) => {
    res.status(200).send('yes this is the mafbot thank you for visiting goodbye');
});

app.get('/vote', (req, res) => {
    const htmlPage = getHtmlPage('vote');
    res.status(200).send(htmlPage);
});

app.get('/authenticate', (req, res) => {
    console.log('got auth request');
    const code = req.url.split('?code=')[1];

    if (code) {
        authorize(code).then(user => {
            console.log(`saved creds for new user: ${user.username}`);
            res.status(200).send(`Thanks for authenticating with MafBot, ${user.username}!`);
        });
    } else {
        console.log(`user denied auth request`);
        res.status(200).send(`That isn't very helpful, I kinda need you to auth with me to work properly.`);
    }
});

app.get('*', (req, res) => res.status(200).send('YOU DONE FUCKED UP BOIII'));

const httpsServer = https.createServer({ key, cert }, app).listen(443, () => console.log('http server ready!'));

http.createServer(((req, res) => {
    res.writeHead(301, { 'Location': `https://mafbot.mafia451.com${req.url}` });
    res.end();
})).listen(80);

const socketServer = new ws.Server({server: httpsServer});
let users = [];
let formal, formalledBy;
let voters = [];

socketServer.on('connection', socket => {
    socket.on('message', message => {
        console.log(`message received: ${message}`);
        const json = JSON.parse(message);
        switch (json.path) {
            case 'login':
                users.push(json.username);
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'user', users: users })));
                break;
            case 'logout':
                users = users.filter(u => u !== json.username);
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'user', users: users })));
                break;
            case 'vote':
                voters.push(json.username);
                break;
            case 'formal':
                formal = json.formal;
                formalledBy = json.username;
                socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'formal', formal: formal, username: formalledBy })));
                setTimeout(() => {
                    socketServer.clients.forEach(client => client.send(JSON.stringify({ path: 'reveal', votes: voters })));
                    voters = [];
                }, 65000);
                break;
        }
    });
});
