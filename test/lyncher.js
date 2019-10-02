const test = require('./test');
const cmd = require('../cmd').Cmd;

const assert = require('assert');
const assertThat = require('./assertions');

module.exports = {
    lyncherWins: lyncherWins,
    lyncherTransforms: lyncherTransforms
};

async function lyncherWins () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['lyncher']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);
    assert.ok(test.users.every(usr => !usr.messages.includes('Lyncher Target')));

    const lynchee = test.gameState.players.find(player => player.mafia.role.truename === 'Lyncher Target');
    const town = test.gameState.players.filter(player => player.mafia.team.name === 'town');

    await test.vote(town[0], lynchee);
    await test.vote(town[1], lynchee);
    await test.vote(town[2], lynchee);
    assertThat.teamWon('lyncher');
}

async function lyncherTransforms () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['lyncher']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);

    const lynchee = test.gameState.players.find(player => player.mafia.role.truename === 'Lyncher Target');
    const lyncher = test.gameState.players.find(player => player.mafia.role.name === 'Lyncher');
    const mafia = test.gameState.players.find(player => player.mafia.role.name === 'Mafioso');
    const d1Lynch = test.gameState.players.find(player => player.mafia.role.name === 'Townie' && player.mafia.role.truename !== 'Lyncher Target');

    await test.vote(lyncher, d1Lynch);
    await test.vote(lynchee, d1Lynch);
    await test.vote(mafia, d1Lynch);
    assert.ok(test.channel.messages.includes('It is now night 1. Send in your actions!'));

    await cmd.getPrivateCommand('mafiakill').execute(mafia.user, [lynchee.displayName], 'mafiakill');
    assert.ok(lyncher.mafia.role.name === 'Townie' && lyncher.mafia.team.name === 'town');
    assert.ok(lyncher.messages.includes('You have a new role. You are now a Townie (town).'));
}