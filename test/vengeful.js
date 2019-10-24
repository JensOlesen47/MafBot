const test = require('./test');
const cmd = require('../build/cmd').Cmd;

const assert = require('assert');
const assertThat = require('./assertions');

module.exports = {
    townWinsByLynchingGoon: townWinsByLynchingGoon,
    townWinsByLynchingGodfather: townWinsByLynchingGodfather
};

async function townWinsByLynchingGoon () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['vengeful']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await cmd.getPublicCommand('go').execute(test.channel, test.users[0]);

    const goon = test.gameState.players.find(player => player.mafia.role.name === 'Goon');
    const godfather = test.gameState.players.find(player => player.mafia.role.name === 'Godfather');
    const town = test.gameState.players.filter(player => player.mafia.role.name === 'Vengeful Townie');

    await test.vote(town[0], goon);
    await test.vote(town[1], goon);
    await test.vote(town[2], goon);
    assertThat.playerWasLynched(goon.displayName, 'Goon', 'mafia');

    await test.vote(town[0], town[0]);
    await test.vote(godfather, town[0]);
    await test.vote(town[1], town[0]);
    assertThat.playerWasLynched(town[0].displayName, 'Townie', 'town');

    await test.vote(town[1], godfather);
    await test.vote(town[2], godfather);
    assertThat.playerWasLynched(godfather.displayName, 'Godfather', 'mafia');

    assertThat.teamWon('town');
}

async function townWinsByLynchingGodfather () {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['vengeful']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await cmd.getPublicCommand('go').execute(test.channel, test.users[0]);

    const godfather = test.gameState.players.find(player => player.mafia.role.name === 'Godfather');
    const town = test.gameState.players.filter(player => player.mafia.role.name === 'Vengeful Townie');

    await test.vote(town[0], godfather);
    await test.vote(town[1], godfather);
    await test.vote(town[2], godfather);
    assertThat.playerWasLynched(godfather.displayName, 'Godfather', 'mafia');

    assertThat.teamWon('town');
}
