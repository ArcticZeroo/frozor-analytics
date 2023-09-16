import * as path from 'node:path';
import { AsyncDatabase } from 'promised-sqlite3';

const databaseFilePath = path.join(process.cwd(), 'analytics.sqlite3');

console.log('Opening database...');
export const db = await AsyncDatabase.open(databaseFilePath);

console.log('Creating tables...');

await db.run(`
    CREATE TABLE IF NOT EXISTS application (
        name TEXT NOT NULL PRIMARY KEY
    )
`);

await db.run(`
    CREATE TABLE IF NOT EXISTS visit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application TEXT NOT NULL,
        userId TEXT NOT NULL UNIQUE,
        FOREIGN KEY (application) REFERENCES application(name)
    )
`);

await db.run(`
    CREATE TABLE IF NOT EXISTS aggregatedVisits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application TEXT NOT NULL,
        count INTEGER NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (application) REFERENCES application(name)
    )
`);

console.log('Clearing old visits...');

await db.run(`
    DELETE FROM visit
`);

console.log('Database is ready!');