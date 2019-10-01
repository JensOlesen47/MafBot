import {TextChannel} from "discord.js";

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

    static findUserMention(channel: TextChannel, displayName: string) : string {
        const guildMember = channel.members.find(member => member.displayName.toLowerCase().includes(displayName.toLowerCase()));
        return guildMember && `<@${guildMember.user.id}>`;
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
