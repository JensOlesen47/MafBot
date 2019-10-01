import {Abilities, MafiaAbility} from "./abilities.lib";

export class MafiaTeam {
    name: string;
    wintext: string;
    openteam?: boolean;
    abilities?: MafiaAbility[];
    constructor(name: string, wintext: string, openteam?: boolean, abilities?: MafiaAbility[]) {
        this.name = name;
        this.wintext = wintext;
        this.openteam = openteam;
        this.abilities = abilities;
    }
}

export const Factions: Map<string, MafiaTeam> = new Map([
    ['town', new MafiaTeam(
        'town',
        'You win when all the bad guys are gone.'
    )],
    ['mafia', new MafiaTeam(
        'mafia',
        'You win when you have majority and there are no other killers.',
        true,
        [Abilities.get('mafiakill')]
    )],
    ['sk', new MafiaTeam(
        'sk',
        'You win when you are in the final two and there are no other killers.',
        false
    )],
    ['lyncher', new MafiaTeam(
        'lyncher',
        'You win if your target is lynched.'
    )],
    ['assassin', new MafiaTeam(
        'assassin',
        ' You win when the King is dead, even if you\'re dead too.'
    )]
]);
