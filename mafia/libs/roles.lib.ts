import {GuildMember} from "discord.js";
import {Abilities, MafiaAbility} from "./abilities.lib";

export class MafiaStatus {
    onstart?: string;
    ghostaction?: string;
    onlynch?: string;
    onroledeath?: string;
    onrolekill?: string;
    onrolelynch?: string;
    gifts?: string[];
    transform?: string;
    inspect?: string;
    immunekill?: number;

    setOnstart(value: string) : MafiaStatus {
        this.onstart = value;
        return this;
    }
    setGhostaction(value: string) : MafiaStatus {
        this.ghostaction = value;
        return this;
    }
    setOnlynch(value: string) : MafiaStatus {
        this.onlynch = value;
        return this;
    }
    setGifts(value: string[]) : MafiaStatus {
        this.gifts = value;
        return this;
    }
    setTransform(value: string) : MafiaStatus {
        this.transform = value;
        return this;
    }
    setInspect(value: string) : MafiaStatus {
        this.inspect = value;
        return this;
    }
    setImmunekill(value: number) : MafiaStatus {
        this.immunekill = value;
        return this;
    }
    setOnroledeath(value: string) : MafiaStatus {
        this.onroledeath = value;
        return this;
    }
    setOnrolekill(value: string) : MafiaStatus {
        this.onrolekill = value;
        return this;
    }
    setOnrolelynch(value: string) : MafiaStatus {
        this.onrolelynch = value;
        return this;
    }
}
export class MafiaRole {
    name: string;
    roletext: string;
    abilities: MafiaAbility[];
    status: MafiaStatus;
    teams: string[];
    power: number;
    basic: boolean;
    truename?: string;
    buddy?: GuildMember;

    constructor(name: string, roletext: string, abilities: MafiaAbility[], status: MafiaStatus, teams?: string[], power? :number, basic?: boolean, truename?: string) {
        this.name = name;
        this.roletext = roletext;
        this.abilities = abilities;
        this.status = status;
        this.teams = teams || [];
        this.power = power || 1;
        this.basic = basic || false;
        this.truename = truename;
    }
}

export const Roles: Map<string, MafiaRole> = new Map([
    ['t', new MafiaRole(
        'Townie',
        'You have nothing but your vote.',
        [],
        new MafiaStatus(),
        ['town'],
        0,
        true
    )],
    ['c', new MafiaRole(
        'Cop',
        'You can inspect another player to learn their alignment. Your results are not guaranteed to be accurate.',
        [Abilities.get('inspect')],
        new MafiaStatus(),
        ['town'],
        1,
        true
    )],
    ['d', new MafiaRole(
        'Doctor',
        'You can protect other players from kills. Each protection stops one kill, and lasts for one night.',
        [Abilities.get('protect')],
        new MafiaStatus(),
        ['town', 'mafia'],
        0.5,
        true
    )],
    ['v', new MafiaRole(
        'Vigilante',
        'You can kill other players. For justice.',
        [Abilities.get('kill')],
        new MafiaStatus(),
        ['town'],
        0.5,
        true
    )],
    ['rb', new MafiaRole(
        'Roleblocker',
        'You can block another player\'s action each night.',
        [Abilities.get('block')],
        new MafiaStatus(),
        ['town', 'mafia'],
        0.6,
        true
    )],
    ['m', new MafiaRole(
        'Mafioso',
        'You are a townie gone bad.',
        [],
        new MafiaStatus(),
        ['mafia'],
        0,
        true
    )],
    ['gf', new MafiaRole(
        'Godfather',
        'Inspections on you will give a \'town\' result, and you cannot be killed by actions. You can still be lynched.',
        [],
        new MafiaStatus().setInspect('town').setImmunekill(100),
        ['mafia'],
        1,
        true
    )],
    ['ss', new MafiaRole(
        'Super-Saint',
        'If you are lynched, the person who cast the final vote on you will die also. Be careful, this can work both for and against you.',
        [],
        new MafiaStatus().setOnlynch('supersaint'),
        ['town']
    )],
    ['ass_guard', new MafiaRole(
        'Guard',
        'You are a guard. The King is BUDDY1. You lose if the king dies, even if all assassins are dead.',
        [],
        new MafiaStatus()
    )],
    ['ass_king', new MafiaRole(
        'King',
        'You are the King. Your guards know who you are, but the assassins don\'t.',
        [],
        new MafiaStatus().setOnstart('action:setbuddy #* #@')
    )],
    ['ass_assassin', new MafiaRole(
        'Assassin',
        'You are an assassin. You don\'t know who the king is, but the guards do. If you die, you get a kill.',
        [],
        new MafiaStatus().setGhostaction('kill').setOnroledeath('King:win')
    )],
    ['ly', new MafiaRole(
        'Lyncher',
        'Your lynch target is BUDDY1. If they are killed you will become a normal townie.',
        [],
        new MafiaStatus().setOnrolekill('Lyncher Target:action:transform #@').setOnrolelynch('Lyncher Target:win').setTransform('t/town')
    )],
    ['tly', new MafiaRole(
        'Townie',
        'You have nothing but your vote.',
        [],
        new MafiaStatus().setOnstart('action:setbuddy #ly #@'),
        [],
        0,
        false,
        'Lyncher Target'
    )]
]);