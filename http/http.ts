const http = require('http');
const api = require('axios').default;
const ws = require('ws');
import {getHtmlPage} from './http.html';

const headers = {'Content-Type':'application/x-www-form-urlencoded'};

const httpServer = http.createServer((req, res) => {
    const htmlPage = getHtmlPage(req.url.substring(1));
    res.writeHead(200, {'Content-Type': 'text/html'});
    if (!htmlPage) {
        res.write('U DONE FUCKED UP BOI');
        res.end();
        return;
    }
    res.write(htmlPage);
    res.end();
});

const socketServer = new ws.Server({server: httpServer});
let users = [];
let formal, formalledBy;
let voters = [];

socketServer.on('connection', socket => {
    socket.on('message', message => {
        const json = JSON.parse(message);
        switch (json.path) {
            case 'login':
                users.push(json.username);
                socket.send(JSON.stringify({ path: 'user', users: users }));
                break;
            case 'logout':
                users = users.filter(u => u !== json.username);
                socket.send(JSON.stringify({ path: 'user', users: users }));
                break;
            case 'vote':
                voters.push(json.username);
                break;
            case 'formal':
                formal = json.formal;
                formalledBy = json.username;
                socket.send(JSON.stringify({ path: 'formal', formal: formal, username: formalledBy }));
                setTimeout(() => {
                    socket.send(JSON.stringify({ path: 'reveal', votes: voters }));
                    voters = [];
                }, 60000);
                break;
        }
    });
});

httpServer.listen(80);

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
