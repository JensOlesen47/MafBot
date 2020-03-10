import {GuildMember, RichEmbed, TextChannel, User} from "discord.js";
import {mafbot} from "../bot";
import * as moment from "moment";
import {addBug, dismissBug, getBug, getBugs, updateBug} from "./db/bug";

export class Core {
    static async ping (channel: TextChannel) : Promise<void> {
        channel.send(`PONGOGONG`);
    }

    static async publicBugs (channel: TextChannel, user: GuildMember) : Promise<void> {
        await Core.bugs(user.user);
    }

    static async bugs (user: User) : Promise<void> {
        const bugs = await getBugs();
        let embed = new RichEmbed().setTitle(`Known Bugs${bugs.length > 25 ? ' (pg 1)' : ''}`);
        for (let i = 0; i < bugs.length; i++) {
            const reporter = await mafbot.fetchUser(bugs[i].reportedby, true);
            const formattedTime = Core.getFormattedTime(bugs[i].timestamp);
            embed.addField(`#${bugs[i].id} - Reported by ${reporter.username} on ${formattedTime}`, bugs[i].comment);
            if ((i + 1) / 25 === 1 && i !== bugs.length - 1) {
                user.send(embed);
                embed = new RichEmbed().setTitle(`Known Bugs (pg ${(i + 1) / 25 + 1})`);
            }
        }
        user.send(embed);
    }

    static async reportBug (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        if (!args[0]) {
            user.send(`If you've got a bug to report, please let me know what it is by using \`!bug [report]\`. Hopefully it's not regarding this command.`);
            return;
        }

        if (!isNaN(Number(args[0]))) {
            const existingBug = await getBug(Number(args[0]));
            if (existingBug) {
                if (existingBug.reportedby === user.id) {
                    const commentToAppend = args.slice(1).join(' ').replace(/[^\s\w]/g, '');
                    await updateBug(existingBug.id, commentToAppend);
                    user.send(`Bug #${args[0]} has been updated with that additional info. Thanks buddy.`);
                    return;
                } else {
                    user.send(`Bug #${args[0]} doesn't belong to you, buddy. You'll have to open a new one in your name!`);
                    return;
                }
            }
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
        await dismissBug(Number(args[0]));
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
