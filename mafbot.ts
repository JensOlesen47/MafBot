import {logger} from "./logger";
import {ChildProcess, fork, execSync} from "child_process";
import * as Express from 'express';
import * as Http from "http";
import * as BodyParser from "body-parser";

let botProcess: ChildProcess, httpProcess: ChildProcess, currentBranch = 'master';
const webhookApi = Express();
webhookApi.use(BodyParser.json());

compile();
startProcesses();

webhookApi.post('/redeploy', (req, res) => {
    logger.debug('received redeploy req from ' + req.ip);
    res.status(201).send();

    // ignore github requests that are not for the current branch
    if (req.body.ref && req.body.ref !== `refs/heads/${currentBranch}`) return;

    if (req.body.branch) {
        currentBranch = req.body.branch;
        checkout(currentBranch);
    }

    compile();
    stopProcesses();
    startProcesses();
});
Http.createServer(webhookApi).listen(8081);

function startProcesses () {
    botProcess = fork(__dirname + '/bot/bot.js');
    httpProcess = fork(__dirname + '/web/http.js');

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
    execSync('git pull && tsc');
}

function checkout (branchName: string) {
    execSync(`git checkout ${branchName}`);
}
