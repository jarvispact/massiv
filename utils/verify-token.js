const jwt = require('jsonwebtoken');

module.exports = (authConfig, headers) => {
    try {
        const { secret, options } = authConfig;
        const { authorization = '' } = headers;
        const authorizationParts = authorization.split(' ');
        const tokenFromHeader = authorizationParts[1];
        const token = jwt.verify(tokenFromHeader, secret, options);
        return { error: null, token };
    } catch (error) {
        return { error, token: null };
    }
};
