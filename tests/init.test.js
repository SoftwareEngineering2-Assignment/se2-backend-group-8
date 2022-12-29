/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const sinon = require('sinon');
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

//GET sources
test('GET /sources returns correct response and status code', async (t) => {
  const token = jwtSign({id: 1});
  const {statusCode} = await t.context.got(`sources/sources?token=${token}`);
  t.is(statusCode, 200);
});



// GET testing URL
test('GET /test-url returns correct status code', async (t) => {
  const { body, statusCode } = await t.context.got('general/test-url?url=https://www.youtube.com');
  // Check if the return status is 200
  t.is(statusCode, 200);
});

// GET test URL request for error
test('GET /test-url returns 500 status and active: false on error', async (t, done) => {
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

// GET test URL request GET,POST,PUT 
test('GET /test-url-request Sends GET request and returns response', async (t) => {
  // Send an HTTP GET request to the /test-url-request route
  const { statusCode } = await t.context.got.get(
    'general/test-url-request?url=https://www.youtube.com&type=GET'
  );
  // Check if the return status is 200
  t.is(statusCode, 200);

  // Send an HTTP POST request to the /test-url-request route
  const { statusCode } = await t.context.got.get(
    'general/test-url-request?url=https://www.youtube.com&type=POST'
  );
  // Check if the return status is 200
  t.is(statusCode, 200);

  // Send an HTTP PUT request to the /test-url-request route
  const { statusCode } = await t.context.got.get(
    'general/test-url-request?url=https://www.youtube.com&type=PUT'
  );
  // Check if the return status is 200
  t.is(statusCode, 200);


});





