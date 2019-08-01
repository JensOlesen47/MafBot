import {GuildMember} from "discord.js";

export class Permissions {
    private static OP_ROLE = "mods";
    private static HOP_ROLE = "HalfOps";
    private static PLAYER_ROLE = "Alive";

    static isOp (user: GuildMember) : boolean {
        return user.roles.some(role => role.name === this.OP_ROLE);
    }

    static isHop (user: GuildMember) : boolean {
        return user.roles.some(role => role.name.includes(this.OP_ROLE));
    }

    static isPlayer (user: GuildMember) : boolean {
        return user.roles.some(role => role.name === this.PLAYER_ROLE);
    }

    static isAny (user: GuildMember) : boolean {
        return true;
    }
}
