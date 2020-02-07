import {existsSync, readFileSync} from 'fs';
import {authScript} from "./auth";

export function getHtmlPage (fileName: string, args?: {[id: string]: string}) : string {
    const filePath = `./http/html/${fileName}`;

    if (!existsSync(filePath + '.html')) {
        return;
    }

    const pageBody = readFileSync(filePath + '.html', {encoding: 'UTF-8'});
    const pageScript = readFileSync(filePath + '.js', {encoding: 'UTF-8'});

    if (args) {
        for (let key of Object.keys(args)) {
            pageBody.replace(`\$\{${key}\}`, args[key]);
            pageScript.replace(`\$\{${key}\}`, args[key]);
        }
    }

    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
        <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
    </head>
    <body>
        <div class="container">
            <a href="https://mafbot.mafia451.com/">MAFBOT</a>
            <span class="float-right" id="authedUserSpan"></span>
            <a class="btn btn-primary float-right" id="authLink" href="https://discordapp.com/api/oauth2/authorize?client_id=487077607427276810&redirect_uri=https%3A%2F%2Fmafbot.mafia451.com%2Fauthenticate&response_type=code&scope=identify%20guilds.join&prompt=none" hidden>LOG IN WITH DISCORD</a>
            <hr/>
            ${pageBody}
        </div>
        
        <script type="application/javascript">${pageScript}</script>
        <script type="application/javascript">
            const authedUsername = localStorage.getItem('discord_username');
            if (authedUsername) {
                document.getElementById('authedUserSpan').innerHTML = 'Logged in as: ' + authedUsername;
            } else {
                document.getElementById('authLink').hidden = false;
            }
        </script>
    </body>
</html>`;
}
