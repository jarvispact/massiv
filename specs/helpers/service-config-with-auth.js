const serviceConfig = require('./service-config');

module.exports = {
    ...serviceConfig,
    auth: {
        secretOrPublicKey: 'extremlysecurepassword',
        options: {
            algorithms: ['HS256'],
        },
    },
};
