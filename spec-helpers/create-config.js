const path = require('path');
const testSecret = require('./test-secret');

module.exports = (props = {}) => ({
    server: {
        host: props.host || '0.0.0.0',
        port: props.port || 3000,
        handlerFolder: props.handlerFolder || path.join(__dirname, '../specs/handler-folder'),
    },
    logger: {
        level: props.logLevel || 'silent',
    },
    auth: props.auth || {
        secret: testSecret,
        disabledRoutes: [
            { method: 'get', route: '/' },
            { method: 'delete', route: '/' },
            { method: 'patch', route: '/' },
            { method: 'post', route: '/' },
            { method: 'put', route: '/' },
            { method: 'patch', route: '/error' },
            { method: 'post', route: '/error' },
            { method: 'put', route: '/error' },
            { method: 'post', route: '/status' },
        ],
        options: {
            algorithms: ['HS256'],
        },
    },
});
