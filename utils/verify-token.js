const jwt = require('jsonwebtoken');

module.exports = async (authConfig, headers) => {
    const { secret, options } = authConfig;
    const { authorization = '' } = headers;
    const authorizationParts = authorization.split(' ');
    const tokenFromHeader = authorizationParts[1];
    return new Promise((resolve) => {
        jwt.verify(tokenFromHeader, secret, options, (error, token) => {
            if (error) return resolve({ error, token: null });
            return resolve({ error: null, token });
        });
    });
};
