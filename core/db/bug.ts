import {User} from "discord.js";
import {query, queryOne, update} from "./database";
import {Bug} from "./types";

export async function addBug (comment: string, user: User) : Promise<number> {
    await update(`INSERT INTO bug (comment, reportedby, timestamp) VALUES ('${comment}', '${user.id}', LOCALTIMESTAMP(0))`);
    return await queryOne<number>(`SELECT id FROM bug ORDER BY id DESC LIMIT 1`);
}

export async function getBugs () : Promise<Bug[]> {
    return await query<Bug>(`SELECT * FROM bug`);
}

export async function dismissBug (id: string) : Promise<void> {
    await update(`DELETE FROM bug WHERE id=${id}`);
}
