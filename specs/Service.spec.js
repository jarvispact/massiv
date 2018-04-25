const path = require('path');
const jwt = require('jsonwebtoken');
const { Service } = require('../');
const { serviceConfig, serviceConfigWithAuth, request, sleep } = require('./helpers');

const expectedTestHandlerFolderArray = [
    { method: 'get', route: '/' },
    { method: 'put', route: '/' },
    { method: 'patch', route: '/' },
    { method: 'post', route: '/' },
    { method: 'delete', route: '/' },
    { method: 'get', route: '/sub' },
    { method: 'put', route: '/sub' },
    { method: 'patch', route: '/sub' },
    { method: 'post', route: '/sub' },
    { method: 'delete', route: '/sub' },
    { method: 'get', route: '/sub/:param' },
    { method: 'put', route: '/sub/:param' },
    { method: 'patch', route: '/sub/:param' },
    { method: 'post', route: '/sub/:param' },
    { method: 'delete', route: '/sub/:param' },
];

test('it should throw if no config was passed to the Service constructor', () => {
    const getInstance = () => new Service();
    expect(getInstance).toThrowError('missing parameter "config"');
});

test('it should throw if no config.server was passed to the Service constructor', () => {
    const getInstance = () => new Service({});
    expect(getInstance).toThrowError('missing parameter "config.server"');
});

test('it should create a new Service Instance', () => {
    const service = new Service(serviceConfig);
    expect(service).toHaveProperty('config');
    expect(service).toHaveProperty('logger');
    expect(service).toHaveProperty('frameworkAdapter');
    expect(service.config).toEqual(serviceConfig);
});

test('it should parse the handler folder recursively', () => {
    const service = new Service(serviceConfig);
    const handlerList = service.parseHandlerFolder();
    const handlerListWithoutFunctions = handlerList.map(item => ({ method: item.method, route: item.route }));
    handlerListWithoutFunctions.forEach(item => expect(expectedTestHandlerFolderArray).toContainEqual(item));
});

test('it should expose a handler function for each file in the test-handler-folder', async () => {
    const service = new Service(serviceConfig);
    const handlerList = service.parseHandlerFolder();
    const input = { params: {}, query: {}, body: {} };
    const promises = handlerList.map(file => file.handler(input));
    const handlerResults = await Promise.all(promises);
    handlerResults.forEach(result => expect(result).toEqual({ response: input }));
});

test('it should start a server and expose all handlers', async () => {
    const service = new Service(serviceConfig);
    const handlerList = service.parseHandlerFolder();
    await service.start();
    const input = { query: { test: 'test' } };
    const promises = handlerList.map(file => request[file.method](`${file.route}?test=test`));
    const httpResults = await Promise.all(promises);
    httpResults.forEach((result) => {
        expect(result.status).toEqual(200);
        expect(result.data.query).toEqual(input.query);
    });
    await service.stop();
});

test('it should call the FrameworkAdapter Methods', async () => {
    let setupHandlersCalled = false;
    let startCalled = false;
    let stopCalled = false;

    /* eslint-disable */
    const TestAdapter = class {
        async setupHandlers() {
            setupHandlersCalled = true;
        }

        async start() {
            startCalled = true;
        }

        async stop() {
            stopCalled = true;
        }
    };
    /* eslint-enable */

    const service = new Service(serviceConfig, TestAdapter);
    await service.start();
    await service.stop();
    expect(setupHandlersCalled).toEqual(true);
    expect(startCalled).toEqual(true);
    expect(stopCalled).toEqual(true);
});

test('it should catch a error in the handler and return a boom http error', async () => {
    const monkeyPatchedConfig = {
        ...serviceConfig,
        server: {
            ...serviceConfig.server,
            handlerFolder: path.join(__dirname, './test-handler-folder2'),
        },
    };

    const service = new Service(monkeyPatchedConfig);
    await service.start();

    try {
        await request.get('/');
    } catch (e) {
        expect(e.response.status).toEqual(500);
        expect(e.response.data).toEqual({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred',
        });
    }

    await service.stop();
});

test('it should catch a boom error in the handler and return a boom http error', async () => {
    const monkeyPatchedConfig = {
        ...serviceConfig,
        server: {
            ...serviceConfig.server,
            handlerFolder: path.join(__dirname, './test-handler-folder2'),
        },
    };

    const service = new Service(monkeyPatchedConfig);
    await service.start();

    try {
        await request.post('/');
    } catch (e) {
        expect(e.response.status).toEqual(400);
        expect(e.response.data).toEqual({
            statusCode: 400,
            error: 'Bad Request',
            message: 'some error',
        });
    }

    await service.stop();
});

test('it should return the http status: "404" if no handler was exported by the handler file', async () => {
    const monkeyPatchedConfig = {
        ...serviceConfig,
        server: {
            ...serviceConfig.server,
            handlerFolder: path.join(__dirname, './test-handler-folder2'),
        },
    };

    const service = new Service(monkeyPatchedConfig);
    await service.start();

    try {
        await request.put('/');
    } catch (e) {
        expect(e.response.status).toEqual(404);
        expect(e.response.data).toEqual({
            statusCode: 404,
            error: 'Not Found',
            message: 'Handler not Found',
        });
    }

    await service.stop();
});

test('it should return the http status: "401" if a invalid token structure was sent', async () => {
    const service = new Service(serviceConfigWithAuth);
    await service.start();

    try {
        await request.get('/', {
            headers: { Authorization: 'invalidtokenstructure' },
        });
    } catch (e) {
        expect(e.response.status).toEqual(401);
        expect(e.response.data).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'jwt must be provided',
        });
    }

    await service.stop();
});

test('it should return the http status: "401" if a invalid token was sent', async () => {
    const invalidToken = 'Bearer eyJhbGciOiJIU.eyJleHAiOjE1MjM3OTg2OTI.AHr7fONMc';
    const service = new Service(serviceConfigWithAuth);
    await service.start();

    try {
        await request.get('/', {
            headers: { Authorization: invalidToken },
        });
    } catch (e) {
        expect(e.response.status).toEqual(401);
        expect(e.response.data).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'invalid token',
        });
    }

    await service.stop();
});

test('it should return the http status: "401" if no Authorization header was sent', async () => {
    const service = new Service(serviceConfigWithAuth);
    await service.start();

    try {
        await request.get('/');
    } catch (e) {
        expect(e.response.status).toEqual(401);
        expect(e.response.data).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'jwt must be provided',
        });
    }

    await service.stop();
});

test('it should return the http status: "401" if a expired token was sent', async () => {
    const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000),
        data: 'foobar',
    }, serviceConfigWithAuth.auth.secretOrPublicKey);

    await sleep(100);

    const service = new Service(serviceConfigWithAuth);
    await service.start();

    try {
        await request.get('/', {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (e) {
        expect(e.response.status).toEqual(401);
        expect(e.response.data).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'jwt expired',
        });
    }

    await service.stop();
});

test('it should return the http status: "200" if a valid token was sent', async () => {
    const token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        data: 'foobar',
    }, serviceConfigWithAuth.auth.secretOrPublicKey);

    const service = new Service(serviceConfigWithAuth);
    await service.start();

    const res = await request.get('/', {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toEqual(200);

    await service.stop();
});

test('it should throw an error if stop was called before start on a service instance', async () => {
    const service = new Service(serviceConfig);
    try {
        await service.stop();
    } catch (e) {
        expect(e.message).toEqual('Service not yet started');
    }
});
