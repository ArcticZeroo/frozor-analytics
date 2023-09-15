import { db } from './sqlite.js';
import { isDuckType } from '@arcticzeroo/typeguard';
import { IAggregatedVisits, IApplication } from '../../models/analytics.js';
import { getDateString } from '../../util/date.js';

export const getApplicationsAsync = async () => {
    const rows = await db.all('SELECT name FROM application');

    return new Set(rows.map(row => {
        if (!isDuckType<IApplication>(row, {
            name: 'string'
        })) {
            throw new Error('Invalid row');
        }

        return row.name;
    }));
}

export const applications = await getApplicationsAsync();

export const addNewApplicationAsync = async (name: string) => {
    if (applications.has(name)) {
        return;
    }

    const result = await db.run('INSERT INTO application (name) VALUES (?)', [name]);
    if (result.changes !== 1) {
        throw new Error('Failed to insert application');
    }

    applications.add(name);
};

export const addNewVisitAsync = async (application: string, userId: string) => {
    const result = await db.run('INSERT INTO visit (application, userId) VALUES (?, ?)', [application, userId]);
    if (result.changes !== 1) {
        throw new Error('Failed to insert visit');
    }
}

const getVisitsQuery = await db.prepare(
    `SELECT COUNT(*) AS count
         FROM visit
         WHERE application = ?`
);

export const getVisitsAsync = async (application: string) => {
    const result = await getVisitsQuery.get([application]);
    return (result['count'] as number | undefined) ?? 0;
}

export const clearVisitsAsync = async (application: string) => {
    await db.run(
        `DELETE FROM visit WHERE application = ?`,
        [application]
    );
}

export const addAggregatedVisitsAsync = async (application: string, count: number, date: Date) => {
    const result = await db.run(
        `INSERT INTO aggregatedVisits (application, count, date) VALUES (?, ?, ?)`,
        [application, count, getDateString(date)]
    );

    if (result.changes !== 1) {
        throw new Error('Failed to insert aggregated visits');
    }
}

export const getAggregatedVisitsAsync = async (application: string, after: string): Promise<Array<IAggregatedVisits>> => {
    const result = await db.all(
        `SELECT count, date
    FROM aggregatedVisits
    WHERE application = ? AND datetime(date) > datetime(?)
    ORDER BY datetime(date) ASC`,
        [application, after]
    );

    return result.map(row => {
        if (!isDuckType<IAggregatedVisits>(row, {
            count: 'number',
            date:  'string'
        })) {
            throw new Error('Invalid row');
        }

        return {
            count: row.count,
            date:  row.date
        };
    });
}

export const performAggregationAsync = async (application: string, time: Date) => {
    // TODO: Use a transaction here
    const count = await getVisitsAsync(application);
    if (count === 0) {
        return;
    }
    await addAggregatedVisitsAsync(application, count, time);
    await clearVisitsAsync(application);
}

export const performHourlyAggregationAsync = async () => {
    const nearestHour = new Date();
    nearestHour.setHours(nearestHour.getHours() - 1);
    nearestHour.setMinutes(0);

    console.log(`Aggregating for time: ${getDateString(nearestHour)}`);

    if (applications.size === 0) {
        console.log('No applications to aggregate');
        return;
    }

    for (const application of applications) {
        console.log('Aggregating for application: ', application);
        await performAggregationAsync(application, nearestHour);
    }

    console.log('Aggregation complete!');
};