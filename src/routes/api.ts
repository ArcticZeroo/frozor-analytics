import { RouteBuilder } from '../models/routes.js';
import Router from '@koa/router';
import { attachRouter } from '../util/koa.js';
import {
    addNewApplicationAsync,
    addNewVisitAsync,
    applications,
    getAggregatedVisitsAsync, getVisitsAsync, performAggregationAsync
} from '../api/storage/database.js';
import Koa, { Context } from 'koa';
import { getDateString } from '../util/date.js';
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

const afterRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const requireAfterDate = (ctx: Context) => {
    const after = ctx.query.after;

    if (!after) {
        return ctx.throw(400, 'Missing after date');
    }

    if (typeof after !== 'string' || !afterRegex.test(after)) {
        return ctx.throw(400, 'Invalid after date');
    }

    return after;
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
        const afterDate = requireAfterDate(ctx);
        ctx.body = await getAggregatedVisitsAsync(applicationName, afterDate);
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