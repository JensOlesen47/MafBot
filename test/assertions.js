const assert = require('assert');
const test = require('./test');

module.exports.testIsReady = async () => {
    const timeout = new Promise(resolve => setTimeout(resolve, 10));
    let i = 0;

    while (i++ < 10) {
        const startMsgs = Object.assign([], test.channel.messages);
        console.log('wait 10ms');
        await timeout;
        if (startMsgs.length === test.channel.messages.length) {
            break;
        }
    }
};

module.exports.teamWon = (teamName) => {
    assert.ok(test.channel.messages.includes(`Game Over! The ${teamName} wins! :tada:`));
};

module.exports.playerWasKilled = (displayName, roleName, teamName) => {
    assert.ok(test.channel.messages.includes(`${displayName} was killed! They were a ${roleName} (${teamName}).`));
};

module.exports.playerWasLynched = (displayName, roleName, teamName) => {
    assert.ok(test.channel.messages.includes(`${displayName} has been lynched! They were a ${roleName} (${teamName}).`));
};
