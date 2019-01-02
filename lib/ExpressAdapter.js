/* eslint-disable no-restricted-syntax, no-await-in-loop */
const Boom = require('boom');
const express = require('express');
const bodyParser = require('body-parser');
const RouteParser = require('route-parser');
const uuid = require('uuid/v4');
const { errorHelpers, isFunction, verifyToken } = require('../utils');

const { tokenError, aclError, noHandlerError, errorWithCode } = errorHelpers;

const ExpressAdapter = class {
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger;
        this.framework = express();
        this.server = null;
    }

    shouldUseAuth(method, route) {
        const { auth } = this.config;
        const hasAuthSetting = auth !== undefined;
        const disabledRoutes = (auth && auth.disabledRoutes) || [];

        for (const disabledRoute of disabledRoutes) {
            const routesFromConfig = Array.isArray(disabledRoute.routes) ? disabledRoute.routes : [disabledRoute.routes];
            const methodsFromConfig = Array.isArray(disabledRoute.methods) ? disabledRoute.methods : [disabledRoute.methods];

            const routeParsers = routesFromConfig.map(r => new RouteParser(r));
            const routeMatches = routeParsers.map(rp => rp.match(route));

            const oneOrMoreRoutesMatched = routeMatches.some(m => m);
            const methodMatches = methodsFromConfig.includes(method) || methodsFromConfig[0] === '*';
            const match = oneOrMoreRoutesMatched && methodMatches;
            return (hasAuthSetting && !match) || false;
        }

        return hasAuthSetting;
    }

    aclCheck({ token, route, method, headers, params, query, body, requestId, logger }) {
        const { acl: aclConfig } = this.config;
        if (aclConfig && aclConfig.routes) {
            for (const routeConfig of aclConfig.routes) {
                const routesFromConfig = Array.isArray(routeConfig.routes) ? routeConfig.routes : [routeConfig.routes];
                const methodsFromConfig = Array.isArray(routeConfig.methods) ? routeConfig.methods : [routeConfig.methods];

                const routeParsers = routesFromConfig.map(r => new RouteParser(r));
                const routeMatches = routeParsers.map(rp => rp.match(route));

                const oneOrMoreRoutesMatched = routeMatches.some(m => m);
                const methodMatches = methodsFromConfig.includes(method) || methodsFromConfig[0] === '*';

                if (oneOrMoreRoutesMatched && methodMatches) {
                    const error = routeConfig.check ? routeConfig.check({ token, headers, params, query, body, requestId, logger }) : null;
                    return error;
                }
            }
        }
    }

    setupHandlers(handlerList) {
        const { config, logger } = this;
        this.framework.use(bodyParser.urlencoded({ extended: false }));
        this.framework.use(bodyParser.json());

        handlerList.forEach(({ method, route, handler }) => {
            const routeInfo = `'${method.toUpperCase()} ${route}'`;
            const useAuth = this.shouldUseAuth(method, route);
            logger.debug(`setup handler: ${routeInfo}. using auth: ${useAuth}`);

            this.framework[method](route, async (req, res) => {
                const { headers, params, query, body } = req;
                const requestId = uuid();

                const { error, token } = useAuth ? await verifyToken(config.auth, headers) : {};
                if (error) {
                    logger.debug(`token verify error at ${routeInfo}. error: `, error);
                    return res.status(401).json(tokenError(error.message));
                }

                const ACLError = useAuth ? await this.aclCheck({ token, route, method, headers, params, query, body, requestId, logger }) : null;
                if (ACLError) {
                    logger.debug(`acl check failed at ${routeInfo}. error message: `, ACLError.message, 'token: ', token);
                    return res.status(401).json(aclError(ACLError.message));
                }

                if (isFunction(handler)) {
                    try {
                        logger.debug(`===> ${routeInfo}`, { requestId, headers, params, query, body });
                        const result = await handler({ headers, token, params, query, body, requestId, logger });
                        const status = result && result.statusCode ? result.statusCode : 200;
                        const response = result && result.statusCode && result.response ? result.response : result;
                        logger.debug(`<=== ${routeInfo}`, { requestId, status, response: result });
                        return res.status(status).json(response);
                    } catch (e) {
                        const err = Boom.isBoom(e) ? e : Boom.boomify(e);
                        if (err.output.statusCode >= 500) {
                            logger.error(`error in handler: ${routeInfo}`, { requestId, Error: e });
                        } else {
                            logger.debug(`handler throwed: ${routeInfo}`, { requestId, Error: e });
                        }
                        return res.status(err.output.statusCode).json(errorWithCode(err));
                    }
                }

                logger.error(`no handler found at: ${routeInfo}`);
                return res.status(404).json(noHandlerError);
            });
        });
    }

    async start() {
        const { logger } = this;
        const { host, port } = this.config.server;
        return new Promise((resolve, reject) => {
            this.server = this.framework.listen(port, host, (err) => {
                /* istanbul ignore next */
                if (err) return reject(err);
                logger.info(`service started at: http://${host}:${port}/`);
                return resolve();
            });
        });
    }

    async stop() {
        if (!this.server) return Promise.reject(new Error('service not yet started'));
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                /* istanbul ignore next */
                if (err) return reject(err);
                return resolve();
            });
        });
    }
};

module.exports = ExpressAdapter;
