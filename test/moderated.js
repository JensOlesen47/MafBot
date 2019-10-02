const test = require('./test');
const cmd = require('../cmd').Cmd;

const assert = require('assert');
const assertThat = require('./assertions');

module.exports = {
    runSimpleSetupWithAutofill: runSimpleSetupWithAutofill
};

async function runSimpleSetupWithAutofill() {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['moderated']);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);

    await cmd.getPrivateCommand('addrole').execute(test.users[0].user, ['mafia', 'mafioso', '"you are a bad man."']);
    await cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);

    const mafioso = test.gameState.players.filter(plyr => plyr.mafia.role.name === 'mafioso' && plyr.mafia.team.name === 'mafia');
    const townies = test.gameState.players.filter(plyr => plyr.mafia.role.name === 'Townie' && plyr.mafia.team.name === 'town');
    assert.ok(mafioso.length === 1);
    assert.ok(townies.length === 2);

    await test.vote(townies[0], mafioso[0]);
    await test.vote(townies[1], mafioso[0]);
    assertThat.teamWon('town');
}