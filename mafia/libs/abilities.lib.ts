export class MafiaAbility {
    name: string;
    priority: number;
    targets: string[];
    helptext: string;
    alias?: string;
    day = false;
    shots = 99;

    constructor(name: string, priority: number, targets: string[], helptext: string, alias?: string) {
        this.name = name;
        this.priority = priority;
        this.targets = targets;
        this.helptext = helptext;
        this.alias = alias;
    }

    isDay() : MafiaAbility {
        this.day = true;
        return this;
    }

    hasShots(shots: number) : MafiaAbility {
        this.shots = shots;
        return this;
    }
}

export const Abilities: Map<string, MafiaAbility> = new Map([
    ['setbuddy', new MafiaAbility(
        'setbuddy',
        1,
        ['alive,nonself', 'alive'],
        'setbuddy [player] [buddy]: Sets another player\'s buddy. This is not intended as a player-usable action.'
    )],
    ['increasestatus', new MafiaAbility(
        'increasestatus',
        2,
        ['alive,nonself'],
        'increasestatus [player]: Increases a status on another player. The exact effects are role-dependent. This is not intended as a player-usable action.'
    )],
    ['decreasestatus', new MafiaAbility(
        'decreasestatus',
        3,
        ['alive,nonself'],
        'increasestatus [player]: Decreases a status on another player. The exact effects are role-dependent. This is not intended as a player-usable action.'
    )],
    ['block', new MafiaAbility(
        'block',
        100,
        ['alive,nonself'],
        'block [player]: Roleblocks a player, preventing them from using their night abilities.'
    )],
    ['protect', new MafiaAbility(
        'protect',
        200,
        ['alive,nonself'],
        'protect [player]: Gives another player immunity to a single kill action for that night.'
    )],
    ['transform', new MafiaAbility(
        'transform',
        300,
        [],
        'transform: You get a new role. The role you get depends on your current role.'
    )],
    ['giveability', new MafiaAbility(
        'giveability',
        400,
        ['alive,nonself'],
        'giveability [player]: Gives a random ability to another player. The ability given depends on your role.'
    )],
    ['suicide', new MafiaAbility(
        'suicide',
        900,
        [],
        'suicide: Kills you. Why would you want to do that?'
    )],
    ['suicidebomb', new MafiaAbility(
        'suicidebomb',
        900,
        ['alive,nonself'],
        'suicidebomb: Kills another player, at the cost of your own life.'
    )],
    ['kill', new MafiaAbility(
        'kill',
        901,
        ['alive,nonself'],
        'kill [player]: Kills another player. A doctor can prevent the kill, and some roles are immune.'
    )],
    ['mafiakill', new MafiaAbility(
        'mafiakill',
        901,
        ['alive,nonself'],
        'mafiakill [player]: Kills another player. Only one mafia can use mafiakill each night. A doctor can prevent the kill, and some roles are immune.',
        'kill'
    )],
    ['inspect', new MafiaAbility(
        'inspect',
        1200,
        ['alive,nonself'],
        'inspect [player]: Determines some information about another player. Be careful, the information might not be true.'
    )],
    ['reveal', new MafiaAbility(
        'reveal',
        1250,
        [],
        'reveal: Reveals your alignment to everyone in the game! You should probably consider not using this if you are not town.'
    )]
]);
