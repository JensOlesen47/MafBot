import {Phase} from "../game-state";

export class MafiaSetup {
    name: string;
    helptext: string;
    basic: boolean;
    unimplemented: boolean;
    hidden: boolean;
    fixed: boolean;
    start: Phase;
    minplayers?: number;
    maxplayers?: number;
    fixedSetups?: FixedSetupArray;
    townpowermult?: number;

    constructor(name: string, helptext: string, basic: boolean, unimplemented: boolean, hidden: boolean, fixed: boolean, start: Phase, minplayers?: number, maxplayers?: number, fixedSetups?: FixedSetupArray, townpowermult?: number) {
        this.name = name;
        this.helptext = helptext;
        this.basic = basic;
        this.unimplemented = unimplemented;
        this.hidden = hidden;
        this.fixed = fixed;
        this.start = start;
        this.minplayers = minplayers;
        this.maxplayers = maxplayers;
        this.fixedSetups = fixedSetups;
        this.townpowermult = townpowermult;
    }
}

class FixedSetup {
    minPlayers: number;
    setup: string[];
    fillRole?: string;
    constructor(minPlayers: number, setup: string[], fillRole?: string) {
        this.minPlayers = minPlayers;
        this.setup = setup;
        this.fillRole = fillRole;
    }
}

class FixedSetupArray {
    setups: FixedSetup[];
    constructor(setups: FixedSetup[]) {
        this.setups = setups;
    }

    getForPlayers(numPlayers: number) : FixedSetup {
        let lastMatch: FixedSetup;
        for (const setup of this.setups) {
            if (setup.minPlayers <= numPlayers) {
                lastMatch = setup;
            } else {
                break;
            }
        }

        while (lastMatch.setup.length < numPlayers) {
            lastMatch.setup.push(lastMatch.fillRole);
        }
        return lastMatch;
    }
}

export const Setups: Map<string, MafiaSetup> = new Map([
    ['straight', new MafiaSetup(
        'straight',
        'straight (3+ players): Only Townies, Cops, Doctors, Vigilantes, Roleblockers, Mafiosi, and Godfathers appear.',
        true,
        false,
        false,
        false,
        Phase.DAY,
        3
    )],
    ['ss3', new MafiaSetup(
        'ss3',
        'ss3 (3 players): A fixed setup with one super-saint, one townie, and one mafioso. If the super-saint is hammered, he kills his hammerer.',
        false,
        false,
        false,
        true,
        Phase.DAY,
        3,
        3,
        new FixedSetupArray([
            new FixedSetup(3, ['ss', 't', 'm/mafia'])
        ])
    )],
    ['assassin', new MafiaSetup(
        'assassin',
        'assassin (4 - 12 players): One player is the King, some are Assassins, and the remainder are Guards. The Guards know who the King is, but the Assassins don\'t. The Assassins win if the King dies. There are no night kills, but if an Assassin is lynched they can kill one player before dying.',
        false,
        false,
        false,
        true,
        Phase.DAY,
        4,
        12,
        new FixedSetupArray([
            new FixedSetup(4, ['ass_king', 'ass_assassin/assassin'], 'ass_guard'),
            new FixedSetup(8, ['ass_king', 'ass_assassin/assassin', 'ass_assassin/assassin'], 'ass_guard'),
            new FixedSetup(12, ['ass_king', 'ass_assassin/assassin', 'ass_assassin/assassin', 'ass_assassin/assassin'], 'ass_guard')
        ])
    )],
    ['lyncher', new MafiaSetup(
        'lyncher',
        'lyncher (4 - 20 players): A fixed setup with one lyncher, one mafioso (5p+), and a bunch of townies. The game ends if the lyncher wins.',
        false,
        false,
        false,
        true,
        Phase.DAY,
        4,
        20,
        new FixedSetupArray([
            new FixedSetup(4, ['tly', 'ly/lyncher'], 't'),
            new FixedSetup(5, ['tly', 'ly/lyncher', 'm/mafia'], 't')
        ])
    )]
]);
