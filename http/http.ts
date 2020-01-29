import {authorize} from "../core/auth";

const http = require('http');
const ws = require('ws');
import {getHtmlPage} from './http.html';

import * as Express from 'express';
const app = Express();

app.get('/vote', (req, res) => {
    const htmlPage = getHtmlPage('vote');
    res.status(200).send(htmlPage);
});

app.get('/authenticate', (req, res) => {
    console.log('got auth request');
    const code = req.url.split('?code=')[1];

    authorize(code).then(user => {
        console.log(`saved creds for new user: ${user.username}`);
        res.status(200).send(user.username);
    });
});

const httpServer = app.listen(80, () => console.log('http server ready!'));

const socketServer = new ws.Server({server: httpServer});
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

// http.createServer((req, res) => {
//     const code = req.url.split('?code=')[1];
//     console.log(req.url);
//     console.log(code);
//     const data = `client_id=&client_secret=&grant_type=authorization_code&redirect_uri=${encodeURIComponent('http://18.223.209.141:8080/')}&scope=${encodeURIComponent('identify gdm.join')}&code=${code}`;
//     console.log(data);
//     api.post('https://discordapp.com/api/oauth2/token', data, { headers }).then(fulfilled => {
//         console.log(fulfilled.data);
//         res.writeHead(200, {'Content-Type': 'text/html'});
//         res.write(getHtmlPage('registrationConfirmed'));
//         res.end();
//     }).catch(rejected => {
//         res.write('oops');
//         res.end();
//     });
// }).listen(8080);

console.log('reddy');
