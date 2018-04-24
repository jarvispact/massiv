const path = require('path');

module.exports = {
    server: {
        host: '0.0.0.0',
        port: 3000,
        handlerFolder: path.join(__dirname, '../test-handler-folder'),
    },
    logger: {
        level: 'silent',
    },
};
