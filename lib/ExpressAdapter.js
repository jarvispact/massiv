const express = require('express');
const bodyParser = require('body-parser');
const Boom = require('boom');
const { validateToken, parseHandlerResult } = require('../utils');

const FrameworkAdapter = class {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.framework = express();
        this.server = null;
    }

    async setupHandlers(fileList, queries, services) {
        const { logger } = this;
        this.framework.use(bodyParser.urlencoded({ extended: false }));
        this.framework.use(bodyParser.json());

        fileList.forEach(({ method, route, handler }) => {
            logger.debug(`Register new handler. Method: '${method.toUpperCase()}',\tRoute: '${route}'`);
            this.framework[method](route, async (req, res) => {
                const { params, query, headers, body } = req;

                const { error, token } = validateToken(this.config.auth, headers, method, route);
                if (error) {
                    logger.error(`Token Validation Error on '${method.toUpperCase()} ${route}'. Error Message: '${error.message}'`);
                    const err = Boom.unauthorized(error.message);
                    return res.status(err.output.statusCode).json(err.output.payload);
                }

                if (handler) {
                    try {
                        const result = await handler({ params, query, headers, body, token, logger, queries, services });
                        const { status, response } = parseHandlerResult(result);
                        return res.status(status).json(response);
                    } catch (e) {
                        logger.error(`Error in handler: '${route}'. Error Message: '${e.message}'`);
                        const err = Boom.isBoom(e) ? e : Boom.boomify(e);
                        return res.status(err.output.statusCode).json(err.output.payload);
                    }
                }

                logger.error(`No handler found for method: "${method}" and route: "${route}"`);
                return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Handler not Found' });
            });
        });
    }

    async start() {
        const { host, port } = this.config.server;
        return new Promise((resolve, reject) => {
            /* istanbul ignore next */
            this.server = this.framework.listen(port, host, (err) => {
                if (err) return reject(err);
                this.logger.info(`Started Service with FrameworkAdapter: Express at: http://${host}:${port}/`);
                return resolve();
            });
        });
    }

    async stop() {
        if (this.server) {
            this.logger.info('Stopping Service');
            this.server.close();
            return Promise.resolve();
        }

        return Promise.reject(new Error('Service not yet started'));
    }
};

module.exports = FrameworkAdapter;
