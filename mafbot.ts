import {logger} from "./logger";
import {ChildProcess, fork, execSync} from "child_process";
import * as Express from 'express';
import * as Http from "http";

let botProcess, httpProcess: ChildProcess;
const webhookApi = Express();

compile();
startProcesses();

webhookApi.post('/redeploy', () => {
    stopProcesses();
    compile();
    startProcesses();
});
Http.createServer(webhookApi).listen(8080);

function startProcesses () {
    botProcess = fork(__dirname + '/bot/bot.js');
    httpProcess = fork(__dirname + '/http/http.js');

    botProcess.on('error', (error) => {
        console.log('bot process stopped due to error');
        logger.error(error);
    });

    httpProcess.on('error', (error) => {
        console.log('http process stopped due to error');
        logger.error(error);
    });
}

function stopProcesses () {
    botProcess.kill('SIGINT');
    httpProcess.kill('SIGINT');
}

function compile () {
    execSync('git pull && tsc', { cwd: __dirname });
}


