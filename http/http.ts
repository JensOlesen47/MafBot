const http = require('http');
const api = require('axios').default;
import {getHtmlPage} from './http.html';

const headers = {'Content-Type':'application/x-www-form-urlencoded'};

http.createServer((req, res) => {
    const htmlPage = getHtmlPage(req.url.substring(1));
    if (!htmlPage) {
        res.write('U DONE FUCKED UP BOI');
        res.end();
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(htmlPage);
    res.end();
}).listen(8080);

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
