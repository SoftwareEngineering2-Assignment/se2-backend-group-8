/* eslint-disable import/no-unresolved */
require('dotenv').config();

const http = require('node:http');
const test = require('ava').serial;
const got = require('got');
const listen = require('test-listen');

const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');

const userG = {
    username: process.env.TEST_USERNAME, 
    id: process.env.TEST_ID,  
    email: process.env.TEST_EMAIL
};

const token = jwtSign(userG);
var idG;

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
    idG = body.dashboards[0].id;
});

test('GET /dashboard returns correct response with a dashboard that exists', async (t) => {
    const id = idG;
    const {body, statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
    t.is(body.dashboard.name,'dummyDash')
    t.assert(body.success);
    t.is(statusCode, 200);
});

test('GET /dashboard returns correct response with a dashboard that doesn\'t exists', async (t) => {
    const id = '63c6786b23f1fd065899aac8';
    const {body, statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${id}`);
    t.is(body.status, 409);
});


test('POST /save-dashboard returns correct response', async (t) =>{

    // const dashboard = {
    //     id: idG,
    //     name: 'dummyDash',
    //     layout: [],
    //     items: {},
    //     nextId : 1
    // };

    const id = idG;
    const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, { json: { id} }); //, {layout}, {items}, {nextId} })
    t.assert(body.success);
})

test('POST /save-dashboard returns correct response when dashboard doesn\'nt exist', async (t) =>{

    // const dashboard = {
    //     id: idG,
    //     name: 'dummyDash',
    //     layout: [],
    //     items: {},
    //     nextId : 1
    // };

    const id = '63c6786b23f1fd065899aac8';
    const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, { json: { id} });
    t.is(body.status, 409);
})

test('POST /clone-dashboard clones dashboard', async (t) => {
    const dashboardId = idG;
    const name = "dummy2";
    const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, { json: { dashboardId, name } });
    t.assert(body.success);
});

test('POST /clone-dashboard clones dashboard that already exists and delete the clone', async (t) => {
    var dashboardId = idG;
    const name = "dummy2";
    var {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, { json: { dashboardId,name } });
    t.is(body.status, 409);

    var {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
    t.assert(body.success);
    
    var cloneDash = body.dashboards.filter(dash => dash.name === 'dummy2');
    id = cloneDash[0].id;

    var {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, { json: {id} });
    t.assert(body.success);
});


test('POST /share-dashboard turns share on and off', async (t) => {
    const dashboardId = idG;
    var {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`, { json: {dashboardId} });
    t.assert(body.success);
    t.is(body.shared,true);
    var {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`, { json: {dashboardId} });
    t.assert(body.success);
    t.is(body.shared,false);
});


test('POST /share-dashboard shares a nonexistant dashboard', async (t) => {
    const dashboardId = '63c6786b23f1fd065899aac8';
    var {body, statusCode} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`, { json: {dashboardId} });
    t.is(body.status, 409);
    t.is(body.message,'The specified dashboard has not been found.');
});


test('POST /check-password-needed when the dashboard doesn\'t require a password and is not shared and is accessed by a different user', async (t) => {
    var dashboardId = idG;
    
    var user = {
        username : 'takis',
        id: '15120518231',
        email: 'trollas1613@trollas.com'
    }

    var {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`, { json: {user, dashboardId} });
    t.assert(body.success);
    t.is(body.shared, false);

});

//TODO check-password-needed if its shared
//TODO check-password-needed if it needs password and is accessed by another user
//TODO check-password-needed if it doesnt need password and is accessed by another user

test('POST /check-password-needed when the dashboard doesn\'t require a password and is not shared and is accessed by a owner', async (t) => {
    var dashboardId = idG;
    
    var user = userG;

    var {body, statusCode} = await t.context.got.post(`dashboards/check-password-needed?token=${token}`, { json: {user, dashboardId} });
    t.assert(body.success);
    t.is(body.owner, 'self');
    t.is(body.shared,false);
    t.is(body.hasPassword, false)
});


    
test('DELETE /delete-dashboard deletes dashboard and checks that there is no dashboard', async (t) => {
    const id = idG;
    var {body,statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, { json: {id} });
    t.assert(body.success);
    t.is(statusCode, 200);

    var {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);

    t.is(body.dashboards.length, 0)
    t.assert(body.success);
    t.is(statusCode, 200);

});

test('DELETE /delete-dashboard deletes dashboard after its already deleted', async (t) => {
    const id = idG;
    const {body,statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, { json: {id} });
    t.is(body.status, 409);
    t.is(body.message,'The selected dashboard has not been found.');
    t.is(statusCode, 200);
});

