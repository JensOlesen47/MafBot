import {GuildMember, Message, TextChannel} from "discord.js";
import {Core} from "../core/core";

export class Silly {
    static async slap (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        const weight = Core.randomNumber(100);

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

    static async doubt (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        let arg = args[0];

        if (!arg) {
            // see who the second-last poster was
            const messages = await channel.fetchMessages({ around: channel.lastMessageID });
            arg = messages.first().member.displayName;
        } else if (arg.includes('everyone') || arg.includes('here')) {
            await channel.send(`Wow ${user.displayName}, that's very edgy of you isn't it. I bet you think you're real clever.\n\nWell you're not.`);
            return;
        }

        const ping = Core.findUserMention(channel, arg) || Core.findUserMention(channel, user.displayName);
        const msg = Core.getRandomArrayValueLogarithmically(Silly.DOUBTS);
        const editable = await channel.send('Thinking... \:thinking:') as Message;
        await Core.waitWithCheck(() => true, 2, 2);
        editable.edit(`${ping} ${msg}`);
    }

    static async respect (channel: TextChannel) : Promise<void> {
        const respectObj = Core.getRandomArrayValueLogarithmically(Silly.RESPECTS, 4);
        const reactable = await channel.send(respectObj.msg) as Message;
        reactable.react(respectObj.emoji);
    }

    private static CREATURES = [
        'spaghetti noodle',
        'doggo',
        'Ed Sheeran',
        'chicken nugget',
        'petunia',
        'mantis shrimp',
        'komodo dragon',
        'sapling',
        'garbonzo bean',
        'baby',
        'cicada',
        'ocelot',
        'platypus',
        'aardvark',
        'steak',
        'goat',
        'wolf',
        'tarantula',
        'bumblebee',
        'ant',
        'yak',
        'impala',
        'panther',
        'stingray',
        'jellyfish',
        'cuttlefish',
        'octopus',
        'arctic char',
        'sea bass',
        'tuna',
        'salmon',
        'trout'
    ];

    private static DOUBTS = [
        'needs to spill the beans ASAP, not because I don\'t know, because I definitely do, it\'s just that it would sound better coming from him, and also I think a person should take responsibility for their actions whenever possible, it\'s a part of living in a society you know, like voting or handing out candy to children in the neighborhood, it\'s just a thing that you should try to do for your fellow humans whenever the opportunity presents itself, I honestly value honesty and I think that everyone should do the same, it\'s what separates us from the cat-people who live on Betelgeuse, like when Karen didn\'t give me back my red Swingline stapler, the one that was a very nice stapler, I was very upset, not because she took it, but because she lied to my face when I confronted her about it, if she were a decent human being she would have just told me and I would have understood you know, but no, she did what she did and got what was coming to her.',
        'is NOT the father.',
        'is beyond reproach. How dare you??',
        'couldn\'t care less about what you think, and I honestly don\'t blame them.',
        'is definitely completely full of shit.',
        'might actually be telling the truth here.',
        'should fess up. We know you\'re lying!',
        'is probably a bit fishy ya.',
    ];

    private static RESPECTS = [
        {msg: 'Dicks out, boys', emoji: '\:eggplant:'},
        {msg: '1 like = 1 prayer', emoji: '\:heart:'},
        {msg: 'So sad, I cry evrytiem', emoji: '\:cry:'},
        {msg: 'Press F to pay respects', emoji: '\:regional_indicator_f:'}
    ];
}
