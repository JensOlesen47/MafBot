import {AxiosStatic} from "axios";
import {getToken, setToken} from "./db/user-token";
import {User} from "discord.js";
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

export async function authorize (authCode: string) : Promise<User> {
    const token = await fetchOAuthToken(authCode);
    const user = await fetchUserInfo(token.access_token);
    await setToken(user.id, token.access_token, token.refresh_token, token.expires_in);

    return user;
}

export async function getAccessTokenForUser (userId: string) : Promise<string> {
    let token = await getToken(userId);
    if (!token) {

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
    const data = `client_id=${auth.bot_id}&client_secret=${auth.bot_secret}&grant_type=authorization_code&redirect_uri=${encodeURIComponent('http://18.223.209.141/authenticate')}&scope=${encodeURIComponent('identify gdm.join')}&code=${authCode}`;

    const response = await api.post<OAuthToken>('https://discordapp.com/api/oauth2/token', data, { headers });
    return response.data;
}

async function refreshOAuthToken (token: UserToken) : Promise<OAuthToken> {
    const headers = { 'Content-Type':'application/x-www-form-urlencoded' };
    const data = `client_id=${auth.bot_id}&client_secret=${auth.bot_secret}&grant_type=refresh_token&refresh_token=${token.refreshtoken}&redirect_uri=${encodeURIComponent('http://18.223.209.141/authenticate')}&scope=${encodeURIComponent('identify gdm.join')}`

    const response = await api.post<OAuthToken>('https://discordapp.com/api/oauth2/token', data, { headers });
    return response.data;
}

async function fetchUserInfo (accessToken: string) : Promise<User> {
    const headers = { authorization: `Bearer ${accessToken}` };

    const response = await api.get<User>('https://discordapp.com/api/users/@me', { headers });
    return response.data;
}
