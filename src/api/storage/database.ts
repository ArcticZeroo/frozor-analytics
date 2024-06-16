import { isDuckType } from '@arcticzeroo/typeguard';
import { IAggregatedVisit } from '../../models/analytics.js';
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
		async client => client.visit.upsert(
			{
				where:  {
					userId_applicationName: {
						applicationName,
						userId
					}
				},
				update: {
					count: {
						increment: 1
					}
				},
				create: {
					applicationName,
					userId,
					count: 1
				}
			}
		)
	);
}

export const getVisitsAsync = async (applicationName: string) => {
	const result = await usePrismaClient(
		client => client.visit.aggregate({
			where:  {
				applicationName
			},
			_count: true,
			_sum:   {
				count: true
			}
		})
	);

	return {
		uniqueUserCount: result._count,
		totalCount:      result._sum.count || 0
	};
}

export const clearAllVisitsAsync = () => {
	return usePrismaClient(
		client => client.visit.deleteMany({})
	);
}

const clearVisitsAsync = async (applicationName: string) => {
	return usePrismaClient(
		client => client.visit.deleteMany({
			where: {
				applicationName
			}
		})
	);
}

interface IAggregatedVisitsParams {
	applicationName: string;
	uniqueUserCount: number;
	totalCount: number;
	date: Date;
}

const addAggregatedVisitsAsync = async ({
											applicationName,
											uniqueUserCount,
											totalCount,
											date
										}: IAggregatedVisitsParams) => {
	return usePrismaClient(
		client => client.aggregatedVisits.create({
			data: {
				applicationName,
				uniqueUserCount,
				totalCount,
				date: getDateString(date)
			}
		})
	);
}

export const getAggregatedVisitsAsync = async (application: string, daysAgo: number): Promise<Array<IAggregatedVisit>> => {
	const minDate = normalizeDate(new Date());
	minDate.setDate(minDate.getDate() - daysAgo);

	const result = await usePrismaClient(
		client => client.$queryRaw`
		SELECT count, totalCount, date
		FROM aggregatedVisits
		WHERE application = ${application} AND datetime(date) >= datetime(${getDateString(minDate)})
		ORDER BY datetime(date) ASC`
	);

	if (!Array.isArray(result)) {
		throw new Error('Invalid result from prisma');
	}

	return result.map(row => {
		if (!isDuckType<IAggregatedVisit>(row, {
			count:      'number',
			totalCount: 'number',
			date:       'string'
		})) {
			throw new Error('Invalid row');
		}

		return {
			count:      row.count,
			totalCount: row.totalCount,
			date:       row.date
		};
	});
}

export const performAggregationAsync = async (applicationName: string, time: Date) => {
	// TODO: Use a transaction here
	// also TODO: Use prisma client and pass it into these methods
	const visitData = await getVisitsAsync(applicationName);

	if (visitData.totalCount === 0 && visitData.uniqueUserCount === 0) {
		return;
	}

	await addAggregatedVisitsAsync({
		applicationName,
		uniqueUserCount: visitData.uniqueUserCount,
		totalCount:      visitData.totalCount,
		date:            time
	});

	await clearVisitsAsync(applicationName);
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