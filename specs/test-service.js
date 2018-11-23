const path = require('path');
const { Service } = require('../');

const config = {
    server: {
        host: '0.0.0.0',
        port: 3000,
        handlerFolder: path.join(__dirname, './handler-folder'),
    },
    logger: {
        level: 'debug',
        prettyPrint: true,
    },
    auth: {
        secret: 'supersecuresecret',
        options: {
            algorithms: ['HS256'],
        },
    },
};

(async () => {
    const service = new Service({ config });
    await service.start();
})();
