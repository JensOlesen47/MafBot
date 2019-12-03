const http = require('http');
const api = require('axios').default;
import {html} from './http.html';

const headers = {'Content-Type':'application/x-www-form-urlencoded'};
const data = {
    'client_id': '487077607427276810',
    'client_secret': 'Ai4r9jbq2cG24U5Oibzd1t4T5wHzDENm',
    'grant_type': 'authorization_code',
    'redirect_uri': 'http://18.223.209.141:8080',
    'scope': 'identify gdm.join',
    'code': null
};

http.createServer((req, res) => {
    const code = req.url.split('?code=')[1];
    console.log(req.url);
    console.log(code);
    data.code = code;
    api.post('https://discordapp.com/api/v6/oauth2/token', data, { headers }).then(fulfilled => {
        console.log(fulfilled.data);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(html);
        res.end();
    });
}).listen(8080);