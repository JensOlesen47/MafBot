import discord = require('discord.js');
import auth = require('./auth.json');

import {DMChannel, Message, TextChannel} from "discord.js";
import {Cmd} from "./cmd";
import {createLogger, format, transports} from "winston";

const logger = createLogger({
	level: 'debug',
	transports: [
		new transports.Console(),
		new transports.File({ filename: 'info.log' })
	],
	format: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		format.colorize(),
		format.simple()
	)
});

const mafbot = new discord.Client();

mafbot.on('ready', () => {
	logger.info(`Connected!`);
	logger.info(`Logged in as: ${mafbot.user.username} - (${mafbot.user.id})`);
});

mafbot.on('message', async function(message: Message) {
	if (message.author.bot) {
		return;
	}
	const channel = message.channel;
	const content = message.content;

	let args: string[];
	let cmdArg: string;

	switch (channel.type) {
		case 'text':
			if (!content.startsWith('!') || content === '!') {
				return;
			}
			args = content.substring(1).split(' ');
			cmdArg = args.shift().toLowerCase();
			const publicCommand = Cmd.getPublicCommand(cmdArg);
			const member = message.member;
			if (!publicCommand) {
				logger.debug(`Received failed PUBLIC command ${cmdArg} [${args}] from user ${member.user.username}`);
				channel.send(`${member.displayName}, that is not a valid command. Shame on you.`);
			} else if (publicCommand.hasPermission(member)) {
				logger.debug(`Executing PUBLIC command ${cmdArg} [${args}] for user ${member.user.username}`);
				await publicCommand.execute(channel as TextChannel, member, args);
			} else {
				channel.send(`Sorry ${member.displayName}, you don't have permission to use that command.`);
			}
			break;
		case 'dm':
			if (content.startsWith('!')) {
				args = parsePrivateArgs(content.substring(1), channel as DMChannel);
			} else {
				args = parsePrivateArgs(content, channel as DMChannel);
			}
			if (!args.length) {
				return;
			}
			cmdArg = args.shift().toLowerCase();
			const privateCommand = Cmd.getPrivateCommand(cmdArg);
			const author = message.author;
			if (!privateCommand) {
				logger.debug(`Received failed PRIVATE command ${cmdArg} [${args}] from user ${author.username}`);
				channel.send(`${author.username}, that is not a valid command. Shame on you.`);
			} else {
				logger.debug(`Executing PRIVATE command ${cmdArg} [${args}] for user ${author.username}`);
				await privateCommand.execute(author, args, cmdArg);
			}
			break;
	}
});

function parsePrivateArgs (content: string, channel: DMChannel) : string[] {
	const args = [] as string[];
	while (content.length) {
		if (!content.startsWith('"')) {
			const spaceIndex = content.indexOf(' ');
			if (spaceIndex === -1) {
				args.push(content);
				return args;
			}
			args.push(content.substring(0, spaceIndex).trim());
			content = content.substring(spaceIndex).trim();
		} else {
			content = content.substring(1);
			const quoteIndex = content.indexOf('"');
			if (quoteIndex === -1) {
				channel.send('Looks like you forgot to close your "s there buddy.');
				return [];
			}
			args.push(content.substring(0, quoteIndex).trim());
			content = content.substring(quoteIndex + 1).trim();
		}
	}
	return args;
}

// noinspection JSIgnoredPromiseFromCall
mafbot.login(auth.token);
