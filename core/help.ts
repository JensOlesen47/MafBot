import {GuildMember, RichEmbed, TextChannel, User} from "discord.js";
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
            await Help.setups(channel);
            return;
        }
    }

    static async setups (channel: TextChannel) : Promise<void> {
        const embed = new RichEmbed().setTitle('Available setups');
        fetchAllSetups(true, true).forEach(setup =>  embed.addField(setup.name, setup.helptext));
        channel.send(embed);
    }

    static async history (user: User) : Promise<void> {
        const embed = new RichEmbed().setTitle('History').setDescription('Returns details about past games. Calling this command with no arguments will return a summary of the games played over the past week.')
            .addField('history summary', 'Gives a summary of the last 25 games played. This is the default option if you provide no arguments.')
            .addField('history last', 'Gives a detailed breakdown of the last game. This is the same as `!spoilers`.')
            //.addField('history [DD-MM-YYYY]', 'e.g. 25-12-2019. Gives a summary of the games played around that date.')
            .addField('history [game ID]', 'Gives a detailed breakdown of the game with the specified id.')
            //.addField('history [[game ID]/last] winners [team]', 'Sets the winning team for a game record.')
            //.addField('history [username]', 'Gives a summary of the last 25 games this user has played.')
        ;
        user.send(embed);
    }
}
