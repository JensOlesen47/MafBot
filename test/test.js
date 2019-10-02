const cmd = require('../cmd');

const PLAYER_ROLE = "Players";
const HOP_ROLE = "HalfOps";
const OP_ROLE = "Ops";
const DEFAULT_ROLE = "Online";

module.exports.users = require('./users.json');
exports.users.forEach(user => {
    user.messages = [];
    user.send = msg => user.messages.push(msg);
    user.user.send = msg => user.messages.push(msg);
    user.roles = [];
    user.addRole = role => user.roles.push(role);
    user.removeRole = role => user.roles.splice(user.roles.indexOf(role), 1);
});

module.exports.opUser = {
    user: {
        id: 1,
        username: 'Urist'
    },
    messages: [],
    displayName: 'Urist',
    send: msg => this.messages.push(msg),
    roles: [{name: OP_ROLE}]
};

module.exports.channel = {
    messages: [],
    send: function (msg) { this.messages.push(msg) },
    overwritePermissions: () => true,
    guild: {
        defaultRole: DEFAULT_ROLE,
        roles: [PLAYER_ROLE]
    },
    members: exports.users
};

module.exports.gameState = require('../mafia/game-state');

module.exports.in = user => {
    cmd.getPublicCommand('in').execute(exports.channel, user);
};

module.exports.vote = async (voter, votee) => {
    await cmd.getPublicCommand('vote').execute(exports.channel, voter, [votee.displayName]);
};

module.exports.waitXMillis = async (seconds = 3) => {
    await new Promise(resolve => setTimeout(resolve, seconds));
};
