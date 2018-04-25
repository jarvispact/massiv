const serviceConfig = require('./service-config');

module.exports = {
    ...serviceConfig,
    auth: {
        secretOrPublicKey: 'extremlysecurepassword',
        options: {
            algorithms: ['HS256'],
        },
    },
    services: {
        mailer: { baseURL: 'http://localhost:3001' },
        account: { baseURL: 'http://localhost:3002' },
    },
};
