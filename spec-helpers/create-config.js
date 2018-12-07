const path = require('path');

module.exports = (props = {}) => {
    const config = {
        server: {
            host: props.host || '0.0.0.0',
            port: props.port || 3000,
            handlerFolder: path.join(__dirname, props.handlerFolder || '../specs/test-handlers'),
        },
        logger: {
            level: process.env.LOG_LEVEL || props.logLevel || 'silent',
        },
    };

    if (props.auth) {
        config.auth = props.auth;
    }

    return config;
};
