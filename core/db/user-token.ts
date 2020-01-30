import {query, update} from "./database";
import {UserToken} from "./types";

export async function setToken (userId: string, accessToken: string, refreshToken: string, expiresIn: number) : Promise<void> {
    const tokenUpdate = `INSERT INTO auth_token (userid, accesstoken, refreshtoken, expiry) VALUES ('${userId}', '${accessToken}', '${refreshToken}', LOCALTIMESTAMP(0) + interval '${expiresIn} seconds')`;
    const onConflict = ` ON CONFLICT (userid) DO UPDATE SET accesstoken='${accessToken}', refreshtoken='${refreshToken}', expiry=LOCALTIMESTAMP(0)+interval '${expiresIn} seconds'`;
    await update(tokenUpdate + onConflict);
}

export async function getToken (userId: string) : Promise<UserToken> {
    const q = `SELECT * FROM auth_token WHERE userid='${userId}'`;
    const tokens = await query<UserToken>(q);
    if (tokens.length === 1) {
        return tokens[0];
    }
    return null;
}

export async function getTokens (userIds: string[]) : Promise<UserToken[]> {
    const q = `SELECT * FROM auth_token WHERE userid IN ('${userIds.join(`','`)}')`;
    return await query<UserToken>(q);
}

export async function deleteToken (userId: string) : Promise<void> {
    const del = `DELETE FROM auth_token WHERE userid='${userId}'`;
    await update(del);
}
