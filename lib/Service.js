const pino = require('pino');
const FrameworkAdapter = require('./FrameworkAdapter');
const { walk } = require('../utils');

const Service = class {
    constructor(config) {
        if (!config) throw new Error('missing parameter "config"');
        if (!config.service) throw new Error('missing parameter "config.service"');
        this.config = config;
        this.logger = pino(this.config.logger || { level: 'info' });
        this.frameworkAdapter = new FrameworkAdapter(this.config, this.logger);
    }

    parseHandlerFolder() {
        const { handlerFolder } = this.config.service;
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
