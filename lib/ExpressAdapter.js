const Boom = require('boom');
const Ajv = require('ajv');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const { errorHelpers, isFunction, verifyToken } = require('../utils');

const { tokenError, validationError, noHandlerError, errorWithCode } = errorHelpers;

const ExpressAdapter = class {
    constructor({ config, logger }) {
        this.config = config;
        this.logger = logger;
        this.ajv = new Ajv(this.config.validation);
        this.framework = express();
        this.server = null;
    }

    setupHandlers(handlerList, upstreams, props) {
        const { ajv, config } = this;
        this.framework.use(bodyParser.urlencoded({ extended: false }));
        this.framework.use(bodyParser.json());

        handlerList.forEach(({ method, route, handler }) => {
            const routeInfo = `'${method.toUpperCase()} ${route}'`;
            const useAuth = handler.config ? handler.config.auth !== !1 : true;
            const validate = handler.schema ? ajv.compile(handler.schema) : () => true;

            this.logger.debug(`setup handler: ${routeInfo}. using auth: ${useAuth}`);
            this.framework[method](route, async (req, res) => {
                const { params, query, headers, body } = req;

                const requestId = uuid();
                const logger = this.logger.child({ requestId });

                const { error, token } = (config.auth && useAuth) ? verifyToken(config.auth, headers) : {};
                if (error) {
                    logger.debug(`token verify error at ${routeInfo}. error: `, error);
                    return res.status(401).json(tokenError(error.message));
                }

                if (!validate({ params, query, headers, body })) {
                    const message = ajv.errorsText(validate.errors);
                    logger.debug(`validation error in handler: ${routeInfo}. error message: '${message}'`);
                    return res.status(400).json(validationError(message));
                }

                if (isFunction(handler)) {
                    try {
                        const beforeHandlerTime = Date.now();
                        const result = await handler({ params, query, headers, token, body, requestId, logger, upstreams, props });
                        const afterHandlerTime = Date.now();
                        const reqTime = afterHandlerTime - beforeHandlerTime;
                        const status = (handler.config && handler.config.status) ? handler.config.status : 200;
                        logger.debug(`handler ${routeInfo} execution time: ${reqTime} ms. will return http status: ${status}`);
                        return res.status(status).json(result);
                    } catch (e) {
                        const err = Boom.isBoom(e) ? e : Boom.boomify(e);
                        if (err.output.statusCode >= 500) {
                            logger.error(`error in handler: ${routeInfo}. error: `, e);
                        } else {
                            logger.info(`handler returned http error: ${routeInfo}. error: `, e);
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
