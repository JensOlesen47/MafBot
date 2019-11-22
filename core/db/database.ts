import auth = require('../../auth.json');

const { Pool, types } = require('pg');
import {logger} from "../../logger";

const postgres = new Pool({
    user: auth.db_user,
    password: auth.db_password,
    database: 'mafia',
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 3000,
    max: 5
});

types.setTypeParser(20, val => parseInt(val));

postgres.on('error', (err => {
    logger.error(`DATABASE ERR ${err.name} ~~~ ${err.message} ${err.stack}`);
}));

export async function query <T> (statement: string) : Promise<T[]> {
    const client = await postgres.connect();
    try {
        const results = await client.query(statement);
        return results.rows as T[];
    } finally {
        client.release();
    }
}

export async function queryOne <T> (statement: string) : Promise<T> {
    const results = await query<T>(statement);
    if (results.length > 1) {
        throw new Error(`Tried to query one but got ${results.length}! Queried: ${statement}`);
    }
    return results[0];
}

export async function update (statement: string) : Promise<void> {
    const client = await postgres.connect();
    try {
        await client.query(statement);
    } finally {
        client.release();
    }
}

export async function transactionalUpdate (transaction: string[]) : Promise<void> {
    const client = await postgres.connect();
    try {
        await client.query('BEGIN');
        for (const statement of transaction) {
            await client.query(statement);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
