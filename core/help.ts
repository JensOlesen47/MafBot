import {GuildMember, PartialTextBasedChannelFields, RichEmbed, TextChannel, User} from "discord.js";
import {fetchAllSetups} from "../mafia/libs/setups.lib";

export class Help {
    static async help (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        if (args.length === 0) {
            user.send(
                `I'm a mafia bot designed with your pleasure in mind.\n` +
                `You can use \`!start [setup]\` to start a game, and \`!in\` to join it.\n` +
                `Once you're in-game, vote with \`!vote [player]\`, and send me your night (or day) actions via DM in the \`[action] [player]\` format.`
                // `You can also use \`!commands\` to see an extended list of the stuff you can do.`
            );
            return;
        }
        const arg = args[0];
        if (arg === 'setups') {
            await Help.publicSetups(channel, user, args);
        } else if (arg === 'history') {
            await Help.history(channel);
        }
    }

    static async publicSetups (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        let numPlayers: number;
        if (/\d{1,2}/.test(args[1])) {
            numPlayers = Number(args[1]);
        }
        await Help.setups(channel, numPlayers);
    }

    static async setups (channel: PartialTextBasedChannelFields, numPlayers: number) : Promise<void> {
        const embed = new RichEmbed().setTitle('Available setups');
        const setups = numPlayers
            ? fetchAllSetups(true, true).filter(setup => numPlayers >= setup.minplayers && numPlayers <= setup.maxplayers)
            : fetchAllSetups(true, true);
        setups.forEach(setup =>  embed.addField(setup.name, setup.helptext));
        channel.send(embed);
    }

    static async history (channel: PartialTextBasedChannelFields) : Promise<void> {
        const embed = new RichEmbed().setTitle('History').setDescription('Returns details about past games. Calling this command with no arguments will return a summary of the last 25 games.')
            .addField('history summary', 'Gives a summary of the last 25 games played. This is the default option if you provide no arguments.')
            .addField('history last', 'Gives a detailed breakdown of the last game. This is the same as `!spoilers`.')
            //.addField('history [DD-MM-YYYY]', 'e.g. `history 25-12-2019`. Gives a summary of the games played around that date. For example, `history 25-12-2019` would get the games played on Dec 25th, 2019 as well as the 24th and 26th.')
            //.addField('history {username|displayName}', 'Gives a summary of the last 25 games this user has played.')
            .addField('history [game ID]', 'Gives a detailed breakdown of the game with the specified id.')
            .addField('history {[game ID]|last} winners [team]', 'Sets the winning team for a game record.')
            .addField('history {[game ID]|last} {username|displayName} {(l)ynched|(k)illed}{(d)ay|(n)ight}[number]', 'Sets the death status of a player in the specified game. For example, `history last "Clever Username" kn1` would tell me that the user Clever Username was killed night one in the last game.')
        ;
        channel.send(embed);
    }
}
