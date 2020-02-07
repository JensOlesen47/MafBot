import {Guild, GuildMember, User} from "discord.js";
import {mafbot} from "../bot";
import {getTokens} from "../core/db/user-token";
import {Player} from "./game-state";
import {logger} from "../logger";

export async function createGuildForPlayers (users: Player[], teamName: string) : Promise<void> {
    const userTokens = await getTokens(users.map(u => u.id));
    if (userTokens.length !== users.length) {
        users.forEach(user => user.send(`I REALLY WANTED TO CREATE A GROUP CHAT FOR YOU BUT NO. ONE OF YOU ISN'T AUTHENTICATED. GOOD JOB. THANKS A LOT.`));
    } else {
        const newGuild = await mafbot.user.createGuild(`MafBot ~ ${teamName} Chat`, 'us-east');
        for (let user of users) {
            const accessToken = userTokens.find(token => token.userid === user.id).accesstoken;
            await addUserToGuild(user.user, user.displayName, newGuild, accessToken);
        }
        newGuild.defaultChannel.send(`Hey guys! Welcome to the ${teamName} chat.`);
    }
}

export async function addUserToGuild (user: User, nick: string, guild: Guild, accessToken: string) : Promise<GuildMember> {
    logger.info(`adding ${nick} to ${guild.name}`);
    return await guild.addMember(user, { accessToken, nick });
}

export async function cleanupGuilds () : Promise<void> {
    const promises = mafbot.guilds.filter(g => g.name.startsWith('MafBot ~ ')).map(g => g.delete());
    await Promise.all(promises);
}
