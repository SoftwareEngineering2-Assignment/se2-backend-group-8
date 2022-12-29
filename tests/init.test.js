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
  const {body, statusCode} = await t.context.got('/general/statistics');
  t.is(body.sources, 0);
  t.assert(body.success);
  t.is(statusCode, 200);
});

//GET sources
test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`/sources/sources?token=${token}`);
  t.is(statusCode, 200);
});


// GET testing URL
test('GET /test-url returns correct status code', async (t) => {
  const { body, statusCode } = await t.context.got('/general/test-url?url=https://www.youtube.com');
  // Check if the return status is 200
  t.is(statusCode, 200);
});

// GET testing URL for error
test('GET /test-url Returns 500 status and active: false on error', async (t, done) => {
  // Creating a stub method  of got,'get'
  const gotStub = sinon
    .stub(got, 'get')
    .throws(new Error('Something went wrong'));
  // Our method rejects on upcoming error
  const { body, statusCode } = await t.context.got('general/test-url?url=http://testinganexceptionalurl35');
  t.is(body.status, 500);
  t.is(body.active, false);
  sinon.restore();
});

// na dw gia ta / sta urls





