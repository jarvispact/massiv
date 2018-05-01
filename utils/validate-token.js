const jwt = require('jsonwebtoken');

const useAuth = (config, method, route) => {
    if (!config) return false;
    const excludedRoutes = Array.isArray(config.excludedRoutes) ? config.excludedRoutes : [];
    const routeFound = excludedRoutes.find(r => r.method === method && r.route === route);
    if (config && routeFound) return false;
    return true;
};

module.exports = (authConfig, headers, method, route) => {
    try {
        if (!useAuth(authConfig, method, route)) return { error: false, token: null };
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
