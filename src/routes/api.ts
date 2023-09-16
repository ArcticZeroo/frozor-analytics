import Router from '@koa/router';
import {
    addNewApplicationAsync,
    addNewVisitAsync,
    applications,
    getAggregatedVisitsAsync,
    getVisitsAsync,
    performAggregationAsync
} from '../api/storage/database.js';
import Koa, { Context } from 'koa';
import { isUniqueConstraintViolation } from '../util/sql.js';

const requireApplicationName = (ctx: Context) => {
    const name = ctx.params.name;
    if (!name) {
        return ctx.throw(400, 'Missing application name');
    }
    return name;
};

const requireExistingApplicationName = (ctx: Context) => {
    const name = requireApplicationName(ctx);
    if (!applications.has(name)) {
        return ctx.throw(404, 'Application not found');
    }
    return name;
};

const maxDaysAgo = 35;

const requireDaysAgo = (ctx: Context) => {
    const daysAgoString = ctx.query.days;

    if (!daysAgoString || typeof daysAgoString !== 'string') {
        return ctx.throw(400, 'Invalid/missing days ago');
    }

    const daysAgo = Number(daysAgoString);
    if (Number.isNaN(daysAgo)) {
        return ctx.throw(400, 'Days ago is not a number');
    }

    if (daysAgo > maxDaysAgo) {
        return ctx.throw(400, 'Days ago is too large');
    }

    return daysAgo;
}

export const registerApiRoutes = (app: Koa) => {
    const router = new Router();

    router.get('/applications', async ctx => {
        ctx.body = Array.from(applications);
    });

    router.post('/applications/:name', async ctx => {
        const applicationName = requireApplicationName(ctx);

        if (applications.has(applicationName)) {
            ctx.status = 304;
            ctx.body = 'Not modified';
            return;
        }

        await addNewApplicationAsync(applicationName);
        ctx.status = 200;
        ctx.body = 'Application created successfully';
    });

    router.put('/applications/:name/visits/visitor/:visitorId', async ctx => {
        const applicationName = requireExistingApplicationName(ctx);

        const visitorId = ctx.params.visitorId;
        if (!visitorId) {
            return ctx.throw(400, 'Missing visitor id');
        }

        try {
            await addNewVisitAsync(applicationName, visitorId);
            ctx.status = 200;
            ctx.body = 'Visit created successfully';
        } catch (err) {
            if (isUniqueConstraintViolation(err)) {
                ctx.status = 304;
                ctx.body = 'Not modified';
            } else {
                throw err;
            }
        }
    });

    router.get('/applications/:name/visits', async ctx => {
        const applicationName = requireExistingApplicationName(ctx);
        const daysAgo = requireDaysAgo(ctx);
        ctx.body = await getAggregatedVisitsAsync(applicationName, daysAgo);
    });

    router.get('/applications/:name/visits/now', async ctx => {
        const applicationName = requireExistingApplicationName(ctx);
        ctx.body = await getVisitsAsync(applicationName);
    });

    router.put('/applications/:name/visits/aggregate', async ctx => {
        const applicationName = requireExistingApplicationName(ctx);
        await performAggregationAsync(applicationName, new Date());
        ctx.body = 'Successfully performed aggregation';
    });

    app.use(router.routes())
        .use(router.allowedMethods());
};