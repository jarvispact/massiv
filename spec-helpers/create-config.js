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
        options: {
            algorithms: ['HS256'],
        },
    },
});
