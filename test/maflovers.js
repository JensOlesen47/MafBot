const test = require('./test');
const cmd = require('../build/cmd').Cmd;

const assert = require('assert');
const assertThat = require('./assertions');

module.exports = {
    townWins: townWins
};

async function townWins () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['maflovers']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await test.in(test.users[5]);
    await cmd.getPublicCommand('go').execute(test.channel, test.users[0]);

    const mafia = test.gameState.players.filter(player => player.mafia.team.name === 'mafia');
    const town = test.gameState.players.filter(player => player.mafia.team.name === 'town');

    await test.vote(town[0], mafia[0]);
    await test.vote(town[1], mafia[0]);
    await test.vote(town[2], mafia[0]);
    await test.vote(town[3], mafia[0]);
    assertThat.teamWon('town');
}