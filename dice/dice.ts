import {GuildMember, TextChannel} from "discord.js";

export class Dice {
    static async roll (channel: TextChannel, user: GuildMember, args: string[]) : Promise<void> {
        if (!args[0]) {
            args.push(`1d6`);
        }
        const rolledDice = [];

        while (args.length > 0) {
            const dice = args.shift().split('d');

            const numberOfDice: number = dice[0] ? Number(dice[0]) : 1;
            const sidesOfDice: number = dice[1] ? Number(dice[1]) : 6;

            for (let i = 0; i < numberOfDice; i++) {
                rolledDice.push(Math.floor(Math.random() * sidesOfDice + 1));
            }
        }
        const total = rolledDice.reduce((a, b) => a + b, 0);

        channel.send(`Hey ${user.displayName}, You rolled a ${total} (${rolledDice.join(', ')}).`);
    }
}