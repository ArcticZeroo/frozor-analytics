import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { registerApiRoutes } from './routes/api.js';

const app = new Koa();

registerApiRoutes(app);

app.use(bodyParser());

export { app };