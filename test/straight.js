const test = require('./test');
const cmd = require('../cmd');

(() => {
    test.logger.info('Starting 6p [straight] test');
    cmd.getPublicCommand('start').execute(test.channel, test.users[0], ['straight']);
    test.in(test.users[0]);
    test.in(test.users[1]);
    test.in(test.users[2]);
    test.in(test.users[3]);
    test.in(test.users[4]);
    test.in(test.users[5]);
    cmd.getPublicCommand('force-start').execute(test.channel, test.users[0]);

    const scum = test.gameState.players.filter(player => player.mafia.team.name === 'mafia');
    const town = test.gameState.players.filter(player => player.mafia.team.name === 'town');

    if (scum.length > 1) {
        test.vote(town[0], scum[0]);
        test.vote(town[1], scum[0]);
        test.vote(town[2], scum[0]);
        test.vote(town[3], scum[0]);
        scum.splice(0, 1);
    } else {
        test.vote(town[0], town[0]);
        test.vote(town[1], town[0]);
        test.vote(town[2], town[0]);
        test.vote(town[3], town[0]);
        town.splice(0, 1);
    }

    cmd.getPrivateCommand('mafiakill').execute(scum[0].user, 'mafiakill', [town[0].displayName]);

    town.forEach(t => {
        if (t.mafia.role.abilities.length > 0) {
            const actn = t.mafia.role.abilities[0];
            const rnd = Math.floor(Math.random() * 3);
            const trgt = town.indexOf(t) === rnd ? town[rnd + 1] : town[rnd];
            cmd.getPrivateCommand(actn).execute(t.user, actn, [trgt.displayName]);
        }
    });
})();