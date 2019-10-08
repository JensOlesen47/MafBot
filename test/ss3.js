const test = require('./test');
const cmd = require('../build/cmd').Cmd;
const assertThat = require('./assertions');

module.exports = {
    townWinsByLynchingSuperSaint: townWinsByLynchingSuperSaint
};

async function townWinsByLynchingSuperSaint () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['ss3']);
    await cmd.getPublicCommand('in').execute(test.channel, test.users[0]);
    await cmd.getPublicCommand('in').execute(test.channel, test.users[1]);
    await cmd.getPublicCommand('in').execute(test.channel, test.users[2]);

    const supersaint = test.gameState.players.find(player => player.mafia.role.name === 'Super-Saint');
    const mafia = test.gameState.players.find(player => player.mafia.role.name === 'Mafioso');

    await test.vote(supersaint, supersaint);
    await test.vote(mafia, supersaint);

    await assertThat.testIsReady();
    assertThat.playerWasLynched(supersaint.displayName, 'Super-Saint', 'town');
    assertThat.playerWasKilled(mafia.displayName, 'Mafioso', 'mafia');
    assertThat.teamWon('town');
}