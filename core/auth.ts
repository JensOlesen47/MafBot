import {AxiosStatic} from "axios";
import {deleteToken, getToken, setToken} from "./db/user-token";
import {GuildMember, TextChannel, User} from "discord.js";
import {UserToken} from "./db/types";

const api: AxiosStatic = require('axios').default;
const auth = require('../auth.json');

interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

const redirect_uri = encodeURIComponent('https://mafbot.mafia451.com/authenticate');
const permissions = encodeURIComponent('identify guilds.join');

export async function publicAuthCmd (channel: TextChannel, user: GuildMember) : Promise<void> {
    await authCmd(user.user);
}

export async function privateAuthCmd (user: User) : Promise<void> {
    await authCmd(user);
}

async function authCmd (user: User) : Promise<void> {
    if (await checkUserAuthorization(user)) {
        user.send(`Yepperoni you're authenticated already!\nIf you want me to forget about you forever, feel free to \`!deauth\`.`);
    }
}

export async function publicDeauthCmd (channel: TextChannel, user: GuildMember) : Promise<void> {
    await deauthCmd(user.user);
}

export async function privateDeauthCmd (user: User) : Promise<void> {
    await deauthCmd(user);
}

async function deauthCmd (user: User) : Promise<void> {
    user.send(`Alright, I'm getting rid of the authentication you gave me.`);
    await deleteToken(user.id);
}

export async function checkUserAuthorization (user: User) : Promise<boolean> {
    const token = await getAccessTokenForUser(user.id);
    if (!token) {
        user.send(`Hey there! I notice that you haven't clicked my button yet.\nPlease go to this link to log in to the bot, it'll allow me to invite you to group chats!\n\nhttps://mafbot.mafia451.com/login`);
    }
    return !!token;
}

export async function authorize (authCode: string) : Promise<User> {
    const token = await fetchOAuthToken(authCode);
    const user = await fetchUserInfo(token.access_token);
    await setToken(user.id, token.access_token, token.refresh_token, token.expires_in);

    return user;
}

export async function getAccessTokenForUser (userId: string) : Promise<string> {
    let token = await getToken(userId);
    if (!token) {
        return null;
    }

    let accessToken = token.accesstoken;

    if (new Date() >= token.expiry) {
        const oauth = await refreshOAuthToken(token);
        await setToken(userId, oauth.access_token, oauth.refresh_token, oauth.expires_in);
        accessToken = oauth.access_token;
    }

    return accessToken;
}

async function fetchOAuthToken (authCode: string) : Promise<OAuthToken> {
    const headers = { 'Content-Type':'application/x-www-form-urlencoded' };
    const data = `client_id=${auth.bot_id}&client_secret=${auth.bot_secret}&grant_type=authorization_code&redirect_uri=${redirect_uri}&scope=${permissions}&code=${authCode}`;

    const response = await api.post<OAuthToken>('https://discordapp.com/api/oauth2/token', data, { headers });
    return response.data;
}

async function refreshOAuthToken (token: UserToken) : Promise<OAuthToken> {
    const headers = { 'Content-Type':'application/x-www-form-urlencoded' };
    const data = `client_id=${auth.bot_id}&client_secret=${auth.bot_secret}&grant_type=refresh_token&refresh_token=${token.refreshtoken}&redirect_uri=${redirect_uri}&scope=${permissions}`;

    const response = await api.post<OAuthToken>('https://discordapp.com/api/oauth2/token', data, { headers });
    return response.data;
}

async function fetchUserInfo (accessToken: string) : Promise<User> {
    const headers = { authorization: `Bearer ${accessToken}` };

    const response = await api.get<User>('https://discordapp.com/api/users/@me', { headers });
    return response.data;
}
