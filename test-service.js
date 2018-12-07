const path = require('path');
const { Service } = require('.');

const { env } = process;

const config = {
    server: {
        host: env.SERVICE_HOST || '0.0.0.0',
        port: env.SERVICE_PORT || 3000,
        handlerFolder: path.join(__dirname, './specs/test-handlers'),
    },
    logger: {
        level: env.LOG_LEVEL || 'debug',
    },
    auth: {
        secret: env.TOKEN_SECRET || 'supersecuresecret',
        options: { algorithms: ['HS256'] },
        disabledRoutes: [
            { method: 'get', route: '/auth-test' },
        ],
    },
};

(async () => {
    const service = new Service({ config });
    await service.start();
})();
