import { isDuckType } from '@arcticzeroo/typeguard';
import { IAggregatedVisits } from '../../models/analytics.js';
import { getDateString, normalizeDate } from '../../util/date.js';
import { usePrismaClient } from './client.js';

export const getApplicationsAsync = async () => {
	return usePrismaClient(async client => {
		const applications = await client.application.findMany({});
		return new Set(applications.map(application => application.name));
	});
}

export const applications = await getApplicationsAsync();

export const addNewApplicationAsync = async (name: string) => {
	if (applications.has(name)) {
		return;
	}

	await usePrismaClient(
		client => client.application.create({
			data: {
				name
			}
		})
	);

	applications.add(name);
};

export const addNewVisitAsync = async (applicationName: string, userId: string) => {
	return usePrismaClient(
		client => client.visit.create({
			data: {
				applicationName,
				userId
			}
		})
	);
}

export const getVisitsAsync = async (applicationName: string) => {
	return usePrismaClient(
		client => client.visit.count({
			where: {
				applicationName
			}
		})
	);
}

export const clearVisitsAsync = async (applicationName: string) => {
	return usePrismaClient(
		client => client.visit.deleteMany({
			where: {
				applicationName
			}
		})
	);
}

export const addAggregatedVisitsAsync = async (applicationName: string, count: number, date: Date) => {
	return usePrismaClient(
		client => client.aggregatedVisits.create({
			data: {
				applicationName,
				count,
				date: getDateString(date)
			}
		})
	);
}

export const getAggregatedVisitsAsync = async (application: string, daysAgo: number): Promise<Array<IAggregatedVisits>> => {
	const minDate = normalizeDate(new Date());
	minDate.setDate(minDate.getDate() - daysAgo);

	const result = await usePrismaClient(
		client => client.$queryRaw`
		SELECT count, date
		FROM aggregatedVisits
		WHERE application = ${application} AND datetime(date) >= datetime(${getDateString(minDate)})
		ORDER BY datetime(date) ASC`
	);

	if (!Array.isArray(result)) {
		throw new Error('Invalid result from prisma');
	}

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