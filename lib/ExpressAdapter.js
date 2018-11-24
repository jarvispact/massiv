const Boom = require('boom');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const { errorHelpers, isFunction, verifyToken } = require('../utils');

const { tokenError, noHandlerError, errorWithCode } = errorHelpers;

const ExpressAdapter = class {
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger;
        this.framework = express();
        this.server = null;
    }

    shouldUseAuth(method, route) {
        const { config } = this;
        const hasAuthSettings = config.auth !== undefined;
        const disabledRoutes = (config.auth && config.auth.disabledRoutes) || [];
        const hasEntryInDisabledRoutes = !!disabledRoutes.find(r => r.method === method && r.route === route);
        return (hasAuthSettings && !hasEntryInDisabledRoutes) || false;
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

                if (isFunction(handler)) {
                    try {
                        const result = await handler({ headers, token, params, query, body, requestId, logger });
                        const status = (handler.config && handler.config.status) ? handler.config.status : 200;
                        return res.status(status).json(result);
                    } catch (e) {
                        const err = Boom.isBoom(e) ? e : Boom.boomify(e);
                        if (err.output.statusCode >= 500) {
                            logger.error(`error in handler: ${routeInfo}. error: `, e);
                        } else {
                            logger.debug(`error in handler: ${routeInfo}. error: `, e);
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
