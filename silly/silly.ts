import {GuildMember, TextChannel} from "discord.js";
import {Core} from "../core/core";

export class Silly {
    static async slap (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        const weight = Core.randomNumber(1000);
        const animalIndex = Core.randomNumber(Silly.CREATURES.length);
        const animal = Silly.CREATURES[animalIndex];

        const pings: string[] = [];
        if (args.length > 3 || args.some(arg => arg.includes('everyone') || arg.includes('here'))) {
            pings.push(Core.findUserMention(channel, user.displayName));
        } else {
            args.forEach(arg => {
                const mention = Core.findUserMention(channel, arg);
                if (mention) {
                    pings.push(mention);
                }
            });
        }

        let joinedPings: string;
        if (pings.length === 1) {
            joinedPings = pings[0];
        } else if (pings.length === 2) {
            joinedPings = `${pings[0]} and ${pings[1]}`;
        } else if (pings.length === 3) {
            joinedPings = `${pings[0]}, ${pings[1]}, and ${pings[2]}`;
        } else {
            joinedPings = Core.findUserMention(channel, 'Urist');
        }

        channel.send(`\:hand_splayed: slaps ${joinedPings} with a ${weight}lb ${animal}!`);
    }

    static async kiss (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        let arg = args[0];

        if (!arg) {
            arg = `himself`;
        } else if ((arg.includes('everyone') || arg.includes('here'))) {
            arg = user.displayName;
        }

        channel.send(`\:kiss: Gives ${arg} a sloppy wet kiss!`);
    }

    private static CREATURES = [
        'trout',
        'salmon',
        'tuna',
        'cuttlefish',
        'panther',
        'impala',
        'yak',
        'ant',
        'bumblebee',
        'tarantula',
        'wolf',
        'doggo',
        'baby',
        'goat',
        'steak',
        'petunia',
        'Ed Sheeran',
        'aardvark',
        'platypus',
        'jellyfish',
        'stingray',
        'komodo dragon',
        'mantis shrimp',
        'sapling',
        'chicken nugget',
        'garbonzo bean',
        'spaghetti noodle',
        'cicada',
        'ocelot'
    ];
}
