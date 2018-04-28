const pino = require('pino');
const axios = require('axios');
const ExpressAdapter = require('./ExpressAdapter');
const { walk } = require('../utils');

const Service = class {
    constructor({ config, FrameworkAdapter } = {}) {
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
        const filePathList = walk(handlerFolder, handlerFolder);

        const handlerList = filePathList.map((file) => {
            const module = require(file.absoluteFilePath); // eslint-disable-line
            const handler = typeof module === 'function' ? module : module.handler;
            return {
                method: file.name,
                route: file.dir,
                handler,
            };
        });

        return handlerList;
    }

    buildServices() {
        const { services } = this.config;
        const entries = Object.entries(services || {});
        const serviceList = {};

        entries.forEach((entry) => {
            serviceList[entry[0]] = axios.create(entry[1]);
        });

        return serviceList;
    }

    async start() {
        const handlerList = this.parseHandlerFolder();
        const services = this.buildServices();
        await this.frameworkAdapter.setupHandlers(handlerList, services);
        return this.frameworkAdapter.start();
    }

    async stop() {
        return this.frameworkAdapter.stop();
    }
};

module.exports = Service;
