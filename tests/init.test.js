/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');

test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});

test.after.always((t) => {
  t.context.server.close();
});

test('GET /statistics returns correct response and status code', async (t) => {
  const {body, statusCode} = await t.context.got('general/statistics');
  t.is(body.sources, 0);
  t.assert(body.success);
  t.is(statusCode, 200);
});

test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {body,statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});

test('GET /dashboards returns correct response and status code', async (t) => {
  // const token = JSON.stringify({
  //   token: JSON.stringify(process.env.TEST_TOKEN),
  //   user: JSON.stringify({
  //       username: process.env.TEST_USERNAME,
  //       id: process.env.TEST_ID,
  //       email: process.env.TEST_EMAIL
  //   }),
  //   _persist: JSON.stringify({version: -1, rehydrated: true})
  // });

  const token = jwtSign({username: process.env.TEST_USERNAME, id: process.env.TEST_ID,  email: process.env.TEST_EMAIL });
  console.log(token)
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
  // t.is(body.name,'dummy')
  console.log(body)
  t.is(statusCode, 200);
});

