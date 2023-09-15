import { app } from './app.js';
import * as cron from 'node-cron';
import { performHourlyAggregationAsync } from './api/storage/database.js';

const port = 4000;

console.log('Webserver listening on port', port);
app.listen(port);

// Every hour
cron.schedule('0 * * * *', () => {
    performHourlyAggregationAsync()
        .catch(err => console.error('Failed to aggregate visits:', err));
});