const pino = require('pino');
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

    async start() {
        const { handlerFolder } = this.config.server;
        const handlerList = parseHandlerFolder(handlerFolder);
        await this.framework.setupHandlers(handlerList);
        return this.framework.start();
    }

    async stop() {
        return this.framework.stop();
    }
};

module.exports = Service;
