import {GuildMember, RichEmbed, TextChannel} from "discord.js";
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
}
