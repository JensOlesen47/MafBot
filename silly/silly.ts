import {GuildMember, Message, PartialTextBasedChannelFields, RichEmbed, TextChannel, User} from "discord.js";
import {Core} from "../core/core";
import {getHistoryForUser, top} from "../core/db/history";

export class Silly {
    static async slap (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        const weight = Core.randomNumber(100);

        const animal = Core.getRandomArrayValueLogarithmically(Silly.CREATURES);

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
            const messages = await channel.fetchMessages({ limit: 2 });
            const last = messages.array()[1];
            arg = last.member.displayName;
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

    static async top (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        const team = args[0];
        if (team && !['town', 'mafia'].includes(team)) {
            channel.send('Try `!top`, or `!top town`, or even `!top mafia`.');
            return;
        }

        const rankings = await top(5, team);
        const displayableRankings = rankings.map((rank, i) =>
            `#${i + 1}: ${Core.findUserDisplayNameById(channel.guild.id, rank.userid)} [${rank.wins}W - ${rank.losses}L ~ ${Math.round(rank.wins / (rank.wins + rank.losses) * 100)}% WR]`
        );
        const embed = new RichEmbed().setTitle(`Top 5 ${team ? `${team} ` : ''}Players:`).setDescription(displayableRankings.join('\n'));
        channel.send(embed);
    }

    static async privateStats (user: User) : Promise<void> {
        await Silly.stats(user, user.id, user.username, true);
    }

    static async publicStats (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        let statsUser = user;
        if (args[0]) {
            const foundUser = channel.members.find(member => member.displayName.toLowerCase() === args[0] || member.displayName.toLowerCase().startsWith(args[0]));
            if (foundUser) {
                statsUser = foundUser;
            }
        }
        await Silly.stats(channel, statsUser.id, Core.findUserMention(channel, statsUser.displayName), statsUser === user);
    }

    private static async stats (channel: PartialTextBasedChannelFields, userId: string, username: string, sameUser: boolean) : Promise<void> {
        const history = (await getHistoryForUser(userId)).filter(game => game.won !== null);

        const townGames = history.filter(game => game.team === 'town');
        const townWins = townGames.filter(game => game.won).length;
        const townLosses = townGames.filter(game => !game.won).length;

        const mafiaGames = history.filter(game => game.team === 'mafia');
        const mafiaWins = mafiaGames.filter(game => game.won).length;
        const mafiaLosses = mafiaGames.filter(game => !game.won).length;

        history.sort((a, b) => a.setupname > b.setupname ? -1 : 1);
        const setupScores = [] as {name: string, wins: number, records: number}[];
        let currentWins = 0;
        let currentSetup = '';
        let numRecords = 0;
        for (let game of history) {
            if (!currentSetup) {
                currentSetup = game.setupname;
            } else if (currentSetup !== game.setupname) {
                setupScores.push({name: currentSetup, wins: currentWins, records: numRecords});
                currentSetup = game.setupname;
                currentWins = 0;
                numRecords = 0;
            }
            currentWins += game.won ? 1 : 0;
            numRecords ++;
        }
        setupScores.push({name: currentSetup, wins: currentWins, records: numRecords});
        setupScores.sort((a, b) => (a.wins - (a.records - a.wins)) - (b.wins - (b.records - b.wins)));
        const bestScore = setupScores[setupScores.length - 1];
        const worstScore = setupScores[0];

        const greeting = sameUser ? `Here are your stats ${username}:` : `Here are ${username}'s stats:`;
        const townStats = `\nTOWN - ${townWins}W/${townLosses}L (${Math.round(townWins / (townWins + townLosses) * 100)}%)`;
        const mafiaStats = `\nMAFIA - ${mafiaWins}W/${mafiaLosses}L (${Math.round(mafiaWins / (mafiaWins + mafiaLosses) * 100)}%)`;
        const townRate = `\n${sameUser ? 'You' : 'They'}'ve rolled town in ${Math.round(townGames.length / history.length * 100)}% of ${sameUser ? 'your' : 'their'} games.`;
        const bestSetup = `\n${sameUser ? 'Your' : 'Their'} best setup appears to be \`${bestScore.name}\`; ${sameUser ? 'you' : 'they'}'ve got a ${Math.round(bestScore.wins / bestScore.records * 100)}% winrate over ${bestScore.records} games.`;
        const worstSetup = `\n${sameUser ? 'You' : 'They'} seem to struggle most with \`${worstScore.name}\`, as ${sameUser ? 'you' : 'they'}'ve lost ${Math.round((worstScore.records - worstScore.wins) / worstScore.records * 100)}% of the ${worstScore.records} times ${sameUser ? 'you' : 'they'}'ve played it.`;
        channel.send(greeting + townStats + mafiaStats + townRate + bestSetup + worstSetup);
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
        {msg: 'Dicks out, boys', emoji: '🍆'},
        {msg: '1 like = 1 prayer', emoji: '❤️'},
        {msg: 'So sad, I cry evrytiem', emoji: '😢'},
        {msg: 'Press F to pay respects', emoji: '🇫'}
    ];
}
