import {MafiaSetup} from "../../mafia/libs/setups.lib";
import {query, transactionalUpdate, update} from "./database";
import {Player, Votecount} from "../../mafia/game-state";
import {History, Ranking} from "./types";

export async function getHistory (limit: number, gameHistoryId?: number) : Promise<History[]> {
    const selectCols = `SELECT game_history.id id, video, winningteam, timestamp, setup.name setupname, userid, guildid, username, role, team, won, death FROM game_history`;
    const setupQuery = ` INNER JOIN setup ON setup.id=game_history.fksetup`;
    const userHistoryQuery = ` INNER JOIN user_history ON fkgamehistory=game_history.id`;
    const gameHistoryCondition = gameHistoryId
        ? ` WHERE game_history.id=${gameHistoryId}`
        : ` WHERE game_history.id IN (SELECT game_history.id FROM game_history ORDER BY game_history.id DESC LIMIT ${limit})`;
    const orderBy = ` ORDER BY id`;
    return await query<History>(selectCols + setupQuery + userHistoryQuery + gameHistoryCondition + orderBy);
}

export async function top (limit: number, team?: string) : Promise<Ranking[]> {
    if (team && !['town', 'mafia'].includes(team)) {
        return;
    }

    const q = `SELECT winstable.userid, wins, losses FROM 
    (SELECT userid, COUNT(userid) wins FROM user_history WHERE won=true ${team ? `AND team='${team}' ` : ''}GROUP BY userid) winstable 
    INNER JOIN 
    (SELECT userid, COUNT(userid) losses FROM user_history WHERE won=false ${team ? `AND team='${team}' ` : ''}GROUP BY userid) lossestable 
    ON winstable.userid = lossestable.userid 
    ORDER BY wins-losses DESC, wins DESC 
    LIMIT ${limit}`;

    return await query<Ranking>(q);
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

export async function addVoteHistory (lynchedPlayer: Player, votecount: Votecount, phaseNumber: number) : Promise<void> {
    // eventually should store the game id somewhere and use it here instead of just taking the last value of the table..
    const historyQuery = `SELECT game_history.id FROM game_history ORDER BY game_history.id DESC LIMIT 1`;
    const voterIds = votecount.entries.find(e => e.votee === lynchedPlayer.displayName).voters.map(v => v.id).join(',');
    const baseUpdate = `INSERT INTO vote_history (fkgamehistory, phase, userid, team, voterids) VALUES `;
    const updateValues = `((${historyQuery}), ${phaseNumber}, '${lynchedPlayer.id}', '${lynchedPlayer.mafia.team.name}', '${voterIds}')`;
    await update(baseUpdate + updateValues);
}

export async function updateHistoryWinners (winningTeam: string, gameHistoryId?: number) : Promise<void> {
    const transaction = [] as string[];
    if (gameHistoryId) {
        transaction.push(`UPDATE game_history SET winningteam='${winningTeam}' WHERE id=${gameHistoryId}`);
        transaction.push(`UPDATE user_history SET won=team='${winningTeam}' WHERE fkgamehistory=${gameHistoryId}`);
    } else {
        const lastIdQuery = 'SELECT game_history.id FROM game_history ORDER BY game_history.id DESC LIMIT 1';
        transaction.push(`UPDATE game_history SET winningteam='${winningTeam}' WHERE id IN (${lastIdQuery})`);
        transaction.push(`UPDATE user_history SET won=team='${winningTeam}' WHERE fkgamehistory IN (${lastIdQuery})`);
    }
    await transactionalUpdate(transaction);
}

export async function updateHistoryUserDeath (userId: string, death: string, gameHistoryId?: number) : Promise<void> {
    const baseUpdate = `UPDATE user_history SET death='${death}' WHERE userid='${userId}' AND fkgamehistory`;
    if (gameHistoryId) {
        await update(`${baseUpdate}=${gameHistoryId}`);
    } else {
        await update(`${baseUpdate} IN (SELECT game_history.id FROM game_history ORDER BY game_history.id DESC LIMIT 1)`);
    }
}

export async function getHistoryForUser (userId: string) : Promise<History[]> {
    const selectCols = `SELECT game_history.id id, video, winningteam, timestamp, setup.name setupname, userid, guildid, username, role, team, won, death FROM game_history`;
    const setupQuery = ` INNER JOIN setup ON setup.id=game_history.fksetup`;
    const userHistoryQuery = ` INNER JOIN user_history ON fkgamehistory=game_history.id`;
    const forThisUser = ` WHERE user_history.userid='${userId}'`;
    return await query<History>(selectCols + setupQuery + userHistoryQuery + forThisUser);
}
