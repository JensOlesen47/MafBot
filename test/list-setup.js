const test = require('./test');
const cmd = require('../build/cmd').Cmd;

(() => {
    cmd.getPublicCommand('setups').execute(test.channel, test.users[0], []);
})();

(() => {
    cmd.getPublicCommand('setups').execute(test.channel, test.opUser, ['hidden']);
})();

(() => {
    cmd.getPublicCommand('setups').execute(test.channel, test.opUser, ['all']);
})();
