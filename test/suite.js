const lyncher = require('./lyncher');
const ss3 = require('./ss3');
const assassin = require('./assassin');
const moderated = require('./moderated');
const vengeful = require('./vengeful');
const maflovers = require('./maflovers');
const cmd = require('../build/cmd').Cmd;
const tests = require('./test');

suite('Setups', function () {
    this.timeout(5000);
    teardown(async function () {
        console.log(tests.channel.messages);
        tests.channel.messages.length = 0;
        await cmd.getPublicCommand('abort').execute(tests.channel, tests.opUser);
    });
    test('5p lyncher - lyncher wins if his target is lynched', lyncher.lyncherWins);
    test('5p lyncher - lyncher transforms into a townie if his target is killed', lyncher.lyncherTransforms);
    test('3p ss3 - town wins due to mafia hammering the super-saint', ss3.townWinsByLynchingSuperSaint);
    test('6p assassin - town wins', assassin.townWins);
    test('6p assassin - assassin wins by suicidebombing the king', assassin.kingIsBombed);
    test('3p moderated - able to run a moderated setup with autofill', moderated.runSimpleSetupWithAutofill);
    test('5p vengeful - town can win by lynching goon, townie, godfather', vengeful.townWinsByLynchingGoon);
    test('5p vengeful - town can win by lynching godfather day one', vengeful.townWinsByLynchingGodfather);
    test('6p maflovers - town can win by lynching one goon', maflovers.townWins);
});