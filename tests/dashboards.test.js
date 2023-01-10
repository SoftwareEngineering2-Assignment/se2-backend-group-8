/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').serial;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');

const token = jwtSign({username: process.env.TEST_USERNAME, id: process.env.TEST_ID,  email: process.env.TEST_EMAIL });
var id;
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});


test('GET /dashboards returns correct response and status code when there is no dashboard', async (t) => {

    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.is(body.dashboards.length, 0)
    t.assert(body.success);
    t.is(statusCode, 200);

});

  
test('POST /create-dashboard posts correctly and returns correct response and status code', async (t) => {

    const name = "dummyDash";
    const {body,statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, { json: {name} });
    console.log(body)
    t.assert(body.success);
    t.is(statusCode, 200);

});

test('POST /create-dashboard posts correctly and returns correct response and status code with dashboard with the same name', async (t) => {

    const name = "dummyDash";
    const {body,statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, { json: {name} });
    t.is(body.status, 409);
    t.is(body.message, 'A dashboard with that name already exists.');

});

test('GET /dashboards returns correct response and status code after POST', async (t) => {

    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.is(body.dashboards[0].name,'dummyDash')
    t.assert(body.success);
    t.is(statusCode, 200);
    id = body.dashboards[0].id;
});
  
  
test('DELETE /delete-dashboard deletes dashboard', async (t) => {
    const {body,statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, { json: {id} });
    t.assert(body.success);
    t.is(statusCode, 200);
});

test('DELETE /delete-dashboard deletes dashboard after its already deleted', async (t) => {
    const {body,statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, { json: {id} });
    t.is(body.status, 409);
    t.is(body.message,'The selected dashboard has not been found.');
    t.is(statusCode, 200);
});


test('GET /dashboards returns correct response and status code after deletion', async (t) => {

    const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.is(body.dashboards.length, 0)
    t.assert(body.success);
    t.is(statusCode, 200);

});