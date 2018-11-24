/* eslint-disable no-underscore-dangle */
const { Service } = require('../');
const { createConfig, createToken, request } = require('../spec-helpers');

test('it should throw if config was not passed to the service constructor', () => {
    const getInstance = () => new Service();
    expect(getInstance).toThrowError('missing option: "config"');
});

test('it should throw if config.server was not passed to the service constructor', () => {
    const getInstance = () => new Service({ config: {} });
    expect(getInstance).toThrowError('missing option: "config.server"');
});

test('it should throw if config.server.host was not passed to the service constructor', () => {
    const getInstance = () => new Service({ config: { server: {} } });
    expect(getInstance).toThrowError('missing option: "config.server.host"');
});

test('it should throw if config.server.port was not passed to the service constructor', () => {
    const getInstance = () => new Service({ config: { server: { host: '0.0.0.0' } } });
    expect(getInstance).toThrowError('missing option: "config.server.port"');
});

test('it should throw if config.server.handlerFolder was not passed to the service constructor', () => {
    const getInstance = () => new Service({ config: { server: { host: '0.0.0.0', port: 3000 } } });
    expect(getInstance).toThrowError('missing option: "config.server.handlerFolder"');
});

test('it should throw if stop is called but the service was not yet started', async () => {
    const service = new Service({ config: createConfig() });

    try {
        await service.stop();
    } catch (e) {
        expect(e.message).toEqual('service not yet started');
    }
});

test('it should create a new service instance', () => {
    const service = new Service({ config: createConfig() });
    expect(service).toHaveProperty('config');
    expect(service).toHaveProperty('logger');
});

test('it should expose a port and setup all handler files', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    const methods = ['delete', 'get', 'patch', 'post', 'put'];
    const promises = methods.map(method => request[method]('/?test=42'));
    const results = await Promise.all(promises);

    results.forEach(({ status, data }) => {
        expect(status).toEqual(200);
        expect(data.query.test).toEqual('42');
    });

    await service.stop();
});

test('it should return http 401 if authentication fails', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    try {
        await request.post('/auth?test=42');
    } catch ({ response }) {
        expect(response.status).toEqual(401);
        expect(response.data).toEqual({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'jwt must be provided',
            code: 'E_TOKEN_VERIFY_ERROR',
        });
    }

    await service.stop();
});

test('it should return http 200 if authentication was successful', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    const body = { test: '42' };
    const Authorization = `Bearer ${createToken()}`;
    const res = await request.post('/auth?test=42', body, { headers: { Authorization } });
    expect(res.status).toEqual(200);
    expect(res.data).toEqual({ params: {}, query: { test: '42' }, body });

    await service.stop();
});

test('it should return http 500 if a normal error was thrown in the handler', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    try {
        await request.put('/error');
    } catch ({ response }) {
        expect(response.status).toEqual(500);
        expect(response.data).toEqual({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred',
            code: 'E_INTERNAL_SERVER_ERROR',
        });
    }

    await service.stop();
});

test('it should return http 500 if a boom internal error was thrown in the handler', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    try {
        await request.patch('/error');
    } catch ({ response }) {
        expect(response.status).toEqual(500);
        expect(response.data).toEqual({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred',
            code: 'E_INTERNAL_SERVER_ERROR',
        });
    }

    await service.stop();
});

test('it should return http 400 if a boom bad request error was thrown in the handler', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    try {
        await request.post('/error');
    } catch ({ response }) {
        expect(response.status).toEqual(400);
        expect(response.data).toEqual({
            statusCode: 400,
            error: 'Bad Request',
            message: 'test error',
            code: 'E_BAD_REQUEST',
        });
    }

    await service.stop();
});

test('it should return http 404 if the required file does not export a handler function', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    try {
        const Authorization = `Bearer ${createToken()}`;
        await request.get('/error', { headers: { Authorization } });
    } catch ({ response }) {
        expect(response.status).toEqual(404);
        expect(response.data).toEqual({
            statusCode: 404,
            error: 'Not Found',
            message: 'Handler not Found',
            code: 'E_HANDLER_NOT_FOUND',
        });
    }

    await service.stop();
});

test('it should allow to set a custom http status in the handler config', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    const { status } = await request.post('/status');
    expect(status).toEqual(201);

    await service.stop();
});

test('it should be possible to set the logLevel on the current service instance', async () => {
    const service = new Service({ config: createConfig() });
    await service.start();

    expect(service.logger.level).toEqual('silent');
    service.setLogLevel('info');
    expect(service.logger.level).toEqual('info');

    await service.stop();
});
