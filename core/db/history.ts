import {MafiaSetup} from "../../mafia/libs/setups.lib";
import {query, transactionalUpdate, update} from "./database";
import {Player} from "../../mafia/game-state";
import {History} from "./types";

export async function getHistory (limit: number, gameHistoryId?: number) : Promise<History[]> {
    const selectCols = `SELECT game_history.id id, video, winningteam, timestamp, setup.name setupname, userid, guildid, username, role, team, won, death FROM game_history`;
    const setupQuery = ` INNER JOIN setup ON setup.id=game_history.fksetup`;
    const userHistoryQuery = ` INNER JOIN user_history ON fkgamehistory=game_history.id`;
    const gameHistoryCondition = gameHistoryId
        ? ` WHERE game_history.id=${gameHistoryId}`
        : ` WHERE game_history.id IN (SELECT game_history.id FROM game_history ORDER BY game_history.id DESC LIMIT ${limit})`;
    return await query<History>(selectCols + setupQuery + userHistoryQuery + gameHistoryCondition);
}

export async function addBasicHistory (setup: MafiaSetup, players: Player[], guildId: string, video: boolean) : Promise<void> {
    const setupQuery = `SELECT id, LOCALTIMESTAMP(0), '${guildId}', ${video} FROM setup WHERE name='${setup.name}'`;
    const gameHistoryUpdate = `INSERT INTO game_history (fksetup, timestamp, guildid, video) ${setupQuery} RETURNING id`;
    const userHistoryBaseUpdate = `WITH rows AS (${gameHistoryUpdate}) INSERT INTO user_history (fkgamehistory, userid, username, role, team) `;
    let userHistoryValues = [] as string[];
    for (const player of players) {
        userHistoryValues.push(`SELECT rows.id, '${player.id}', '${player.user.username}', '${player.mafia.role.truename || player.mafia.role.name}', '${player.mafia.team.name}' FROM rows`);
    }
    const historyUpdate = userHistoryBaseUpdate + userHistoryValues.join(' UNION ALL ');
    await update(historyUpdate);
}

export async function updateHistory (gameHistoryId: number, winningTeam: string) : Promise<void> {
    const transaction = [] as string[];
    transaction.push(`UPDATE game_history SET winningteam='${winningTeam}' WHERE id=${gameHistoryId}`);
    transaction.push(`UPDATE user_history SET won=team='${winningTeam}' WHERE fkgamehistory=${gameHistoryId}`);
    await transactionalUpdate(transaction);
}
