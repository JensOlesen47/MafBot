import {GuildMember, TextChannel, User} from "discord.js";
import {Core} from "./core/core";
import {Dice} from "./dice/dice";
import {Silly} from "./silly/silly";
import {Permissions} from "./core/permissions";

import mafia = require('./mafia/commands/commands');
import action = require('./mafia/commands/actions');

export class Cmd {
    static getPublicCommand (cmd: string) : PublicCommand {
        switch (cmd) {
            case 'help':
                return new PublicCommand(Core.help, Permissions.isAny);
            case 'ping':
                return new PublicCommand(Core.ping, Permissions.isOp);
            case 'roll':
                return new PublicCommand(Dice.roll, Permissions.isAny);
            case 'slap':
                return new PublicCommand(Silly.slap, Permissions.isAny);
            case 'mute':
                return new PublicCommand(Core.mute, Permissions.isHop);
            case 'unmute':
                return new PublicCommand(Core.unmute, Permissions.isHop);
            case 'start':
                return new PublicCommand(mafia.startGame, Permissions.isAny);
            case 'in':
                return new PublicCommand(mafia.playerIn, Permissions.isAny);
            case 'out':
                return new PublicCommand(mafia.playerOut, Permissions.isAny);
            case 'abort':
                return new PublicCommand(mafia.abortGame, Permissions.isHop);
            case 'force-start':
                return new PublicCommand(mafia.beginGame, Permissions.isAny);
            case 'kiss':
                return new PublicCommand(Silly.kiss, Permissions.isAny);
            case 'vote':
            case 'v':
                return new PublicCommand(mafia.vote, Permissions.isPlayer);
            case 'unvote':
            case 'uv':
                return new PublicCommand(mafia.unvote, Permissions.isPlayer);
            case 'votecount':
            case 'vc':
                return new PublicCommand(mafia.voteCount, Permissions.isPlayer);
            case 'setups':
                return new PublicCommand(mafia.listSetups, Permissions.isAny);
        }
    }

    static getPrivateCommand (cmd: string) : PrivateCommand {
        switch (cmd) {
            case 'modkill':
                return new PrivateCommand(mafia.modkill);
            case 'addrole':
                return new PrivateCommand(mafia.addRole);
            case 'removerole':
                return new PrivateCommand(mafia.removeRole);
            default:
                return new PrivateCommand(action.doAction);
        }
    }
}

class PublicCommand {
    execute: (channel: TextChannel, user?: GuildMember, args?: string[]) => Promise<void>;
    hasPermission: (user: GuildMember) => boolean;

    constructor(command: (channel: TextChannel, user?: GuildMember, args?: string[]) => Promise<void>, auth?: (user: GuildMember) => boolean) {
        this.execute = command;
        this.hasPermission = auth || Permissions.isAny;
    }
}

class PrivateCommand {
    execute: (user: User, args: string[], cmd?: string) => Promise<void>;

    constructor(command: (user: User, args: string[], cmd?: string) => Promise<void>) {
        this.execute = command;
    }
}
