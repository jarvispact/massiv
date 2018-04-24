const pino = require('pino');
const ExpressAdapter = require('./ExpressAdapter');
const { walk } = require('../utils');

const Service = class {
    constructor(config, FrameworkAdapter) {
        if (!config) throw new Error('missing parameter "config"');
        if (!config.server) throw new Error('missing parameter "config.server"');
        this.config = config;
        this.FrameworkAdapter = FrameworkAdapter || ExpressAdapter;
        /* istanbul ignore next */
        this.logger = pino(this.config.logger || { level: 'info' });
        this.frameworkAdapter = new this.FrameworkAdapter(this.config, this.logger);
    }

    parseHandlerFolder() {
        const { handlerFolder } = this.config.server;
        const handlerList = walk(handlerFolder, handlerFolder);
        return handlerList;
    }

    async start() {
        const handlerList = this.parseHandlerFolder();
        await this.frameworkAdapter.setupHandlers(handlerList);
        return this.frameworkAdapter.start();
    }

    async stop() {
        return this.frameworkAdapter.stop();
    }
};

module.exports = Service;
