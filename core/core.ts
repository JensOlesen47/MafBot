import {GuildMember, RichEmbed, TextChannel, User} from "discord.js";
import {mafbot} from "../bot";
import * as moment from "moment";
import {addBug, dismissBug, getBugs} from "./db/bug";

export class Core {
    static async ping (channel: TextChannel) : Promise<void> {
        channel.send(`PONGOGONG`);
    }

    static async publicBugs (channel: TextChannel, user: GuildMember) : Promise<void> {
        await Core.bugs(user.user);
    }

    static async bugs (user: User) : Promise<void> {
        const bugs = await getBugs();
        const embed = new RichEmbed().setTitle('Known Bugs');
        for (let bug of bugs) {
            const reporter = await mafbot.fetchUser(bug.reportedby, true);
            const formattedTime = Core.getFormattedTime(bug.timestamp);
            embed.addField(`#${bug.id} - Reported by ${reporter.username} on ${formattedTime}`, bug.comment);
        }
        user.send(embed);
    }

    static async reportBug (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        if (!args[0]) {
            user.send(`If you've got a bug to report, please let me know what it is by using \`!bug [report]\`. Hopefully it's not regarding this command.`);
            return;
        }
        const comment = args.join(' ').replace(/[^\s\w]/g, '');
        const bug = await addBug(comment, user.user);
        user.send(`Thanks for reporting this bug! Your bug's ID number is ${bug.id}. Sleep soundly knowing that today, you have made a difference.`);
    }

    static async dismissBug (user: User, args: string[]) : Promise<void> {
        if (user.id !== '135782754267693056') {
            user.send(`Only daddy can use this command.`);
            return;
        }
        await dismissBug(args[0]);
        user.send(`Bug dismissed.`);
    }

    static randomNumber (roof: number) : number {
        return Math.floor(Math.random() * roof);
    }

    static async mute (channel: TextChannel) : Promise<void> {
        await channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: false });
    }

    static async unmute (channel: TextChannel) : Promise<void> {
        await channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: true });
    }

    static getRandomArrayValue<T> (array: T[]) : T {
        return array[this.randomNumber(array.length)];
    }

    static getRandomArrayValueLogarithmically<T> (array: T[], base: number = 2) : T {
        // index n is `base` times as likely to be selected as index n-1, etc.
        const b = Math.pow(base, array.length) - 1;
        const randomNumber = this.randomNumber(b) + 1;
        const randomLogged = Math.floor(Math.log(randomNumber) / Math.log(base));
        return array[randomLogged];
    }

    static shuffleArray<T> (array: T[]) : T[] {
        let currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = this.randomNumber(currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    static filterMap<K, V> (map: Map<K, V>, predicate: (value: V) => boolean) : V[] {
        return [...map]
            .map(([, value]) => value)
            .filter(predicate);
    }

    static async help (channel: TextChannel) : Promise<void> {
        channel.send(`\:construction: under construction \:construction:`);
    }

    static findUserMention (channel: TextChannel, displayName: string) : string {
        const guildMember = channel.members.find(member => member.displayName.toLowerCase().includes(displayName.toLowerCase()));
        return guildMember && `<@${guildMember.user.id}>`;
    }

    static findUserDisplayNameById (guildId: string, userId: string) : string {
        const guild = mafbot.guilds.find(g => g.id === guildId);
        const guildMember = guild.members.find(member => member.id === userId);
        return guildMember && guildMember.displayName;
    }

    static getFormattedTime (timestamp: string) : string {
        return moment(timestamp).format('ll');
    }

    static async waitWithCheck (predicate: () => boolean = () => false, check: number = 2, seconds: number = 60) : Promise<boolean> {
        let i = 0;
        const maxIterations = seconds / check;

        do {
            await new Promise(resolve => setTimeout(resolve, check * 1000));
            if (maxIterations <= i++) {
                return false;
            }
        } while (!predicate());
        return true;
    }
}
