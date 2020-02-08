import {GuildMember} from "discord.js";
import {Abilities, MafiaAbility} from "./abilities.lib";

export class MafiaStatus {
    onstart?: string;
    ghostaction?: string;
    onlynch?: string;
    onroledeath?: string;
    onrolekill?: string;
    onrolelynch?: string;
    onphase?: string;
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
    setOnphase(value: string) : MafiaStatus {
        this.onphase = value;
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
    )],
    ['venge_t', new MafiaRole(
        'Vengeful Townie',
        'You\'re a special kind of VT. If you are lynched on day one, you will be able to shoot somebody.',
        [],
        new MafiaStatus().setOnrolelynch('Godfather:win').setOnphase('day 2:action:transform #@').setTransform('t/town').setGhostaction('kill')
    )],
    ['venge_m', new MafiaRole(
        'Goon',
        'If your godfather is lynched, you lose the game.',
        [],
        new MafiaStatus()
    )],
    ['venge_gf', new MafiaRole(
        'Godfather',
        'If you are lynched, your team loses.',
        [],
        new MafiaStatus()
    )],
    ['lover', new MafiaRole(
        'Lover',
        'If your soulmate BUDDY1 dies, you will die as well.',
        [],
        new MafiaStatus().setOnstart('action:setbuddy #lover #@').setOnroledeath('Lover:action:suicide')
    )],
    ['mason', new MafiaRole(
        'Mason',
        'You know that your buddies are town.',
        [],
        new MafiaStatus().setOnstart('action:setbuddy #mason #@')
    )],
    ['suibomb', new MafiaRole(
        'Suicide Bomber',
        'During the day, you may target a player to kill both you and them.',
        [Abilities.get('suicidebomb').isDay()],
        new MafiaStatus()
    )],
    ['inno', new MafiaRole(
        'Innocent Child',
        'You may publicly reveal yourself to be town.',
        [Abilities.get('reveal')],
        new MafiaStatus()
    )],
    ['v1', new MafiaRole(
        'One-shot Vigilante',
        'You are a vigilante, but you only have one bullet left. You can kill a person during the night, but only once!',
        [Abilities.get('kill').hasShots(1)],
        new MafiaStatus()
    )],
    ['dayvig', new MafiaRole(
        'Dayvig',
        'You have unlimited shots, try not to abuse it.',
        [Abilities.get('kill').isDay()],
        new MafiaStatus()
    )],
    ['parity', new MafiaRole( // not implemented
        'Parity Cop',
        'You can inspect people, but you won\'t know what your results mean until you get a flip.',
        [],
        new MafiaStatus()
    )],
    ['fog_cm', new MafiaRole( // not implemented
        'Combat Medic',
        'At night, you will be told who is dying and can choose whether to save them. Also, if you\'re lynched you\'ll get to kill somebody. You lose your powers if somebody else uses theirs.',
        [],
        new MafiaStatus()
    )],
    ['fog_m', new MafiaRole( // not implemented
        'Vengeful Goon',
        'If you\'re lynched, you get to kill somebody. You lose this power if the combat medic or your partner use theirs.',
        [],
        new MafiaStatus()
    )],
    ['macho_cop', new MafiaRole( // not implemented
        'Macho Cop',
        'You can inspect another player at night, learning whether they are town or mafia. You are too cool for school and cannot be protected from night kills.',
        [Abilities.get('inspect')],
        new MafiaStatus()
    )],
    ['scared_doc', new MafiaRole( // not implemented
        'Scared Doctor',
        'You can save one person other than yourself each night. However, if you so much as hint that you\'re the doctor, you will lose your powers and won\'t be able to save anybody any more.',
        [Abilities.get('protect')],
        new MafiaStatus()
    )]
]);