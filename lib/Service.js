const pino = require('pino');
const axios = require('axios');
const ExpressAdapter = require('./ExpressAdapter');
const { parseHandlerFolder, validate } = require('../utils');

const Service = class {
    constructor({ config, Adapter } = {}) {
        validate({ config });
        this.config = config;
        /* istanbul ignore next */
        this.logger = pino(this.config.logger || { level: 'info' });
        const FrameworkAdapter = Adapter || ExpressAdapter;
        this.framework = new FrameworkAdapter({ config, logger: this.logger });
    }

    buildUpstreamServices() {
        const { config, logger } = this;
        const { upstreams = {} } = config;
        const entries = Object.entries(upstreams);
        const services = {};

        entries.forEach(([name, options]) => {
            logger.debug(`setup upstream service: '${name}'`);
            services[name] = axios.create(options);
        });

        this.upstreams = services;
        return services;
    }

    setLogLevel(level) {
        this.logger.level = level;
    }

    async start(props = {}) {
        const { handlerFolder } = this.config.server;
        const handlerList = parseHandlerFolder(handlerFolder);
        const upstreams = this.buildUpstreamServices();
        this.framework.setupHandlers(handlerList, upstreams, props);
        return this.framework.start();
    }

    async stop() {
        return this.framework.stop();
    }
};

module.exports = Service;
