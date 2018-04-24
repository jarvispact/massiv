const jwt = require('jsonwebtoken');

module.exports = (authConfig, headers) => {
    try {
        if (!authConfig) return { error: false, token: null };
        const { authorization = '' } = headers;
        const authorizationParts = authorization.split(' ');
        const tokenFromHeader = authorizationParts[1];
        const { secretOrPublicKey, options } = authConfig;
        const token = jwt.verify(tokenFromHeader, secretOrPublicKey, options);
        return { error: false, token };
    } catch (error) {
        return { error, token: null };
    }
};
