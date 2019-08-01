import discord = require('discord.js');
import logger = require('winston');
import auth = require('./auth.json');

import {Message, TextChannel} from "discord.js";
import {Cmd} from "./cmd";

logger.level = 'debug';

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
			if (content.substring(0,1) !== '!') {
				return;
			}
			args = content.substring(1).split(' ');
			cmdArg = args.shift().toLowerCase();
			const publicCommand = Cmd.getPublicCommand(cmdArg);
			const member = message.member;
			if (!publicCommand) {
				channel.send(`${member.displayName}, that is not a valid command. Shame on you.`);
			} else if (publicCommand.hasPermission(member)) {
				await publicCommand.execute(channel as TextChannel, member, args);
			} else {
				channel.send(`Sorry ${member.displayName}, you don't have permission to use that command.`);
			}
			break;
		case 'dm':
			if (content.substring(0,1) === '!') {
				args = content.substring(1).split(' ');
			} else {
				args = content.split(' ');
			}
			cmdArg = args.shift().toLowerCase();
			const privateCommand = Cmd.getPrivateCommand(cmdArg);
			const author = message.author;
			if (!privateCommand) {
				channel.send(`${author.username}, that is not a valid command. Shame on you.`);
			} else {
				await privateCommand.execute(author, cmdArg, args);
			}
			break;
	}
});

// noinspection JSIgnoredPromiseFromCall
mafbot.login(auth.token);
