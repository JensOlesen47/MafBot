const assertThat = require('./assertions');
const test = require('./test');
const cmd = require('../cmd');

module.exports = {
    townWins: townWins,
    kingIsBombed: kingIsBombed
};

async function townWins () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['assassin']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await test.in(test.users[5]);
    await cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);

    const scum = test.gameState.players.find(player => player.mafia.role.name === 'Assassin');
    const guards = test.gameState.players.filter(player => player.mafia.role.name === 'Guard');

    await test.vote(guards[0], scum);
    await test.vote(guards[1], scum);
    await test.vote(guards[2], scum);
    const hammerVote = test.vote(guards[3], scum);

    await test.waitXMillis(50);

    await cmd.getPrivateCommand('kill').execute(scum.user, 'kill', [guards[0].displayName]);
    await hammerVote;

    await assertThat.testIsReady();
    assertThat.playerWasLynched(scum.displayName, 'Assassin', 'assassin');
    assertThat.playerWasKilled(guards[0].displayName, 'Guard', 'town');
    assertThat.teamWon('town');
}

async function kingIsBombed () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['assassin']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await test.in(test.users[5]);
    await cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);

    const scum = test.gameState.players.find(player => player.mafia.team.name === 'assassin');
    const king = test.gameState.players.find(player => player.mafia.role.name === 'King');
    const guards = test.gameState.players.filter(player => player.mafia.role.name === 'Guard');

    await test.vote(guards[0], scum);
    await test.vote(guards[1], scum);
    await test.vote(guards[2], scum);
    const hammerVote = test.vote(guards[3], scum);

    await test.waitXMillis(50);
    await cmd.getPrivateCommand('kill').execute(scum.user, 'kill', [king.displayName]);
    await hammerVote;

    await assertThat.testIsReady();
    assertThat.playerWasLynched(scum.displayName, 'Assassin', 'assassin');
    assertThat.playerWasKilled(king.displayName, 'King', 'town');
    assertThat.teamWon('assassin');
}
