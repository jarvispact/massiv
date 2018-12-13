const { expect } = require('chai');
const { Service } = require('../');
const { request, createConfig, testSecret, createToken } = require('../spec-helpers');

describe('Service', () => {
    it('should throw if config was not passed to the service constructor', () => {
        const getInstance = () => new Service();
        expect(getInstance).to.throw('missing option: "config"');
    });

    it('should throw if config.server was not passed to the service constructor', () => {
        const getInstance = () => new Service({ config: {} });
        expect(getInstance).to.throw('missing option: "config.server"');
    });

    it('should throw if config.server.host was not passed to the service constructor', () => {
        const getInstance = () => new Service({ config: { server: {} } });
        expect(getInstance).to.throw('missing option: "config.server.host"');
    });

    it('should throw if config.server.port was not passed to the service constructor', () => {
        const getInstance = () => new Service({ config: { server: { host: '0.0.0.0' } } });
        expect(getInstance).to.throw('missing option: "config.server.port"');
    });

    it('should throw if config.server.handlerFolder was not passed to the service constructor', () => {
        const getInstance = () => new Service({ config: { server: { host: '0.0.0.0', port: 3000 } } });
        expect(getInstance).to.throw('missing option: "config.server.handlerFolder"');
    });

    it('should create a service instance with the specified config options', () => {
        const service = new Service({ config: createConfig({ host: '0.0.0.0', port: 3000, logLevel: 'silent' }) });
        expect(service.config.server.host).to.equal('0.0.0.0');
        expect(service.config.server.port).to.equal(3000);
        expect(service.config.logger.level).to.equal('silent');
    });

    it('should throw a error if stop is called on a server that was not yet startet', async () => {
        const service = new Service({ config: createConfig({ host: '0.0.0.0', port: 3000, logLevel: 'silent' }) });
        try {
            await service.stop();
            expect(true).to.equal(false);// ensure that the function throwed
        } catch (e) {
            expect(e.message).to.equal('service not yet started');
        }
    });

    it('should start a http server and expose the handlers in the test-handler folder', async () => {
        const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
        const service = new Service({ config: createConfig(cnfg) });
        await service.start();

        const methods = ['delete', 'get', 'patch', 'post', 'put'];
        const results = await Promise.all(methods.map(method => request[method]('/?foo=bar')));

        results.forEach((result) => {
            expect(result.status).to.equal(200);
            expect(result.data).to.eql({ query: { foo: 'bar' } });
        });

        await service.stop();
    });

    describe('auth', () => {
        it('should start a http server and apply a jwt auth on all handlers', async () => {
            const auth = { secret: testSecret, options: { algorithms: ['HS256'] } };
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers', auth };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/?foo=bar')));

            results.forEach((result) => {
                expect(result.status).to.equal(401);
                expect(result.data).to.eql({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'jwt must be provided',
                    code: 'E_TOKEN_VERIFY_ERROR',
                });
            });

            const authTestResults = await Promise.all(methods.map(method => request[method]('/auth-test?foo=bar')));

            authTestResults.forEach((result) => {
                expect(result.status).to.equal(401);
                expect(result.data).to.eql({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'jwt must be provided',
                    code: 'E_TOKEN_VERIFY_ERROR',
                });
            });

            await service.stop();
        });

        it('should not pass validation if expired token was sent in the "Authorization" header', async () => {
            const token = await createToken({ secret: testSecret, exp: '-5m' });
            const auth = { secret: testSecret, options: { algorithms: ['HS256'] } };
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers', auth };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const headers = { Authorization: `Bearer ${token}` };

            const results = await Promise.all(methods.map(method => request({ method, url: '/?foo=bar', headers })));

            results.forEach((result) => {
                expect(result.status).to.equal(401);
                expect(result.data).to.eql({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'jwt expired',
                    code: 'E_TOKEN_VERIFY_ERROR',
                });
            });

            const authTestResults = await Promise.all(methods.map(method => request({ method, url: '/auth-test?foo=bar', headers })));

            authTestResults.forEach((result) => {
                expect(result.status).to.equal(401);
                expect(result.data).to.eql({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'jwt expired',
                    code: 'E_TOKEN_VERIFY_ERROR',
                });
            });

            await service.stop();
        });

        it('should should pass the jwt auth if a valid token was sent in the "Authorization" header', async () => {
            const token = await createToken({ secret: testSecret, exp: '5m' });
            const auth = { secret: testSecret, options: { algorithms: ['HS256'] } };
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers', auth };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const headers = { Authorization: `Bearer ${token}` };

            const results = await Promise.all(methods.map(method => request({ method, url: '/?foo=bar', headers })));

            results.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.eql({ query: { foo: 'bar' } });
            });

            const authTestResults = await Promise.all(methods.map(method => request({ method, url: '/auth-test?foo=bar', headers })));

            authTestResults.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.eql({ query: { foo: 'bar' } });
            });

            await service.stop();
        });

        it('should not use jwt auth if handler is in "disabledRoutes" in auth config', async () => {
            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const disabledRoutes = methods.map(method => ({ method, route: '/auth-test' }));
            const auth = { secret: testSecret, disabledRoutes, options: { algorithms: ['HS256'] } };
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers', auth };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const resultsWithAuth = await Promise.all(methods.map(method => request[method]('/?foo=bar')));

            resultsWithAuth.forEach((result) => {
                expect(result.status).to.equal(401);
                expect(result.data).to.eql({
                    statusCode: 401,
                    error: 'Unauthorized',
                    message: 'jwt must be provided',
                    code: 'E_TOKEN_VERIFY_ERROR',
                });
            });

            const resultsWithoutAuth = await Promise.all(methods.map(method => request[method]('/auth-test?foo=bar')));

            resultsWithoutAuth.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.eql({ query: { foo: 'bar' } });
            });

            await service.stop();
        });
    });

    describe('custom http status', () => {
        it('should allow a custom http status for each handler file', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const { status, data } = await request.post('/custom-status?foo=bar');
            expect(status).to.equal(201);
            expect(data).to.eql({ query: { foo: 'bar' } });

            const { status: status2, data: data2 } = await request.delete('/custom-status?foo=bar');
            expect(status2).to.equal(204);
            expect(data2).to.equal('');

            await service.stop();
        });
    });

    describe('route params', () => {
        it('should setup the routes correctly with nested route-params', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];

            const idResults = await Promise.all(methods.map(method => request[method]('/params-test/1234')));

            idResults.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.eql({ params: { id: '1234' } });
            });

            const anotherParamResults = await Promise.all(methods.map(method => request[method]('/params-test/1234/5678')));

            anotherParamResults.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data).to.eql({ params: { id: '1234', anotherParam: '5678' } });
            });

            await service.stop();
        });
    });

    describe('handler-file arguments', () => {
        it('should pass all arguments to the handler-file', async () => {
            const token = await createToken({ secret: testSecret, exp: '5m', data: { test: 42 } });
            const auth = { secret: testSecret, options: { algorithms: ['HS256'] } };
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers', auth };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['patch', 'post', 'put'];
            const headers = { Authorization: `Bearer ${token}` };

            const data = { baz: 'blub' };
            const results = await Promise.all(methods.map(method => request({ method, url: '/handler-arguments/1234?foo=bar', headers, data })));

            results.forEach((result) => {
                expect(result.status).to.equal(200);
                expect(result.data.headers.authorization).to.equal(`Bearer ${token}`);
                expect(result.data.headers.host).to.equal('0.0.0.0:3000');
                expect(result.data.token.data).to.eql({ test: 42 });
                expect(result.data.params).to.eql({ id: '1234' });
                expect(result.data.query).to.eql({ foo: 'bar' });
                expect(result.data.body).to.eql({ baz: 'blub' });
                expect(result.data.requestId).to.exist;
                expect(result.data.logger).to.exist;
            });

            await service.stop();
        });
    });

    describe('error-handling', () => {
        it('should return a boom http 500 error if a normal javascript error was thrown', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/normal-error')));

            results.forEach((result) => {
                expect(result.status).to.equal(500);
                expect(result.data).to.eql({
                    statusCode: 500,
                    error: 'Internal Server Error',
                    message: 'An internal server error occurred',
                    code: 'E_INTERNAL_SERVER_ERROR',
                });
            });

            await service.stop();
        });

        it('should return the boom http error that was thrown in the handler', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/boom-error')));

            results.forEach((result) => {
                expect(result.status).to.equal(400);
                expect(result.data).to.eql({
                    statusCode: 400,
                    error: 'Bad Request',
                    message: 'a boom error',
                    code: 'E_BOOM_ERROR',
                    data: { foo: 'bar' },
                });
            });

            await service.stop();
        });

        it('should return http 404 if the handler file exists but there is no handler function', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/no-handler-function')));

            results.forEach((result) => {
                expect(result.status).to.equal(404);
                expect(result.data).to.eql({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Handler not Found',
                    code: 'E_HANDLER_NOT_FOUND',
                });
            });

            await service.stop();
        });

        it('should return http 404 if the handler file does not exists', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/no-handler-file')));

            results.forEach((result) => {
                expect(result.status).to.equal(404);
                expect(result.data).to.exist;
            });

            await service.stop();
        });

        it('should return http 404 if the route does not exists', async () => {
            const cnfg = { host: '0.0.0.0', port: 3000, logLevel: 'silent', handlerFolder: '../specs/test-handlers' };
            const service = new Service({ config: createConfig(cnfg) });
            await service.start();

            const methods = ['delete', 'get', 'patch', 'post', 'put'];
            const results = await Promise.all(methods.map(method => request[method]('/route-does-not-exists')));

            results.forEach((result) => {
                expect(result.status).to.equal(404);
                expect(result.data).to.exist;
            });

            await service.stop();
        });
    });
});
