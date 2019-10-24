const test = require('./test');
const cmd = require('../build/cmd').Cmd;

const assert = require('assert');

module.exports = {
    buddyKnowledge: buddyKnowledge
};

async function buddyKnowledge() {
    await cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['masons']);
    await test.in(test.users[0]);
    await test.in(test.users[1]);
    await test.in(test.users[2]);
    await test.in(test.users[3]);
    await test.in(test.users[4]);
    await test.in(test.users[5]);
    await test.in(test.users[6]);
    await test.in(test.users[7]);
    await test.in(test.users[8]);
    await test.in(test.users[9]);
    await test.in(test.users[10]);
    await test.in(test.users[11]);

    await cmd.getPublicCommand('go').execute(test.channel, test.users[0]);

    const masons = test.gameState.players.filter(plyr => plyr.mafia.role.name === 'Mason');
    assert.ok(masons.length === 3);

    masons.forEach(mason => {
        const buddies = masons.filter(m => m.id !== mason.id).map(m => m.displayName);
        const knowsBuddies = mason.messages.includes(`Your town buddies: ${buddies.join(', ')}`);
        assert.ok(knowsBuddies);
    })
}