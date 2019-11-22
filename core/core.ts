import {TextChannel} from "discord.js";
import {mafbot} from "../bot";
import * as moment from "moment";

export class Core {
    static async ping (channel: TextChannel) : Promise<void> {
        channel.send(`PONGOGONG`);
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
        return moment(timestamp).format('lll') + ' EST';
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
