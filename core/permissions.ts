import {GuildMember} from "discord.js";

export class Permissions {
    private static OP_ROLE = "discord mods";
    private static HOP_ROLE = "HalfOps";
    private static PLAYER_ROLE = "Alive";

    static isOp (user: GuildMember) : boolean {
        return user.roles.some(role => role.name === Permissions.OP_ROLE);
    }

    static isHop (user: GuildMember) : boolean {
        return user.roles.some(role => role.name.includes(Permissions.OP_ROLE));
    }

    static isPlayer (user: GuildMember) : boolean {
        return user.roles.some(role => role.name === Permissions.PLAYER_ROLE);
    }

    static isAny (user: GuildMember) : boolean {
        return true;
    }
}
