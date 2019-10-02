const lyncher = require('./lyncher');
const ss3 = require('./ss3');
const assassin = require('./assassin');
const cmd = require('../cmd');
const tests = require('./test');

suite('Setups', function () {
    this.timeout(5000);
    teardown(function () {
        console.log(tests.channel.messages);
        tests.channel.messages.length = 0;
        cmd.getPublicCommand('abort').execute(tests.channel, tests.opUser);
    });
    test('5p lyncher - lyncher wins if his target is lynched', lyncher.lyncherWins);
    test('5p lyncher - lyncher transforms into a townie if his target is killed', lyncher.lyncherTransforms);
    test('3p ss3 - town wins due to mafia hammering the super-saint', ss3.townWinsByLynchingSuperSaint);
    test('6p assassin - town wins', assassin.townWins);
    test('6p assassin - assassin wins by suicidebombing the king', assassin.kingIsBombed);
});