const pino = require('pino');
const axios = require('axios');
const ExpressAdapter = require('./ExpressAdapter');
const { walk, toCamelCase } = require('../utils');

const Service = class {
    constructor({ config, db, FrameworkAdapter } = {}) {
        if (!config) throw new Error('missing parameter "config"');
        if (!config.server) throw new Error('missing parameter "config.server"');
        this.config = config;
        this.db = db;
        this.FrameworkAdapter = FrameworkAdapter || ExpressAdapter;
        /* istanbul ignore next */
        this.logger = pino(this.config.logger || { level: 'info' });
        this.frameworkAdapter = new this.FrameworkAdapter(this.config, this.logger);
    }

    async applyMigrations() {
        const { logger } = this;
        const { migrationFolder } = this.config.server;
        if (!this.db || !migrationFolder) return;
        const migrationPathList = walk(migrationFolder, migrationFolder);
        const migrations = migrationPathList.map(file => ({ fileName: file.base, module: require(file.absoluteFilePath) })); // eslint-disable-line

        /* istanbul ignore next */
        const migrationsDown = [].concat(migrations).sort((a, b) => {
            if (a.fileName > b.fileName) return -1;
            if (a.fileName < b.fileName) return 1;
            return 0;
        });

        /* istanbul ignore next */
        const migrationsUp = [].concat(migrations).sort((a, b) => {
            if (a.fileName > b.fileName) return 1;
            if (a.fileName < b.fileName) return -1;
            return 0;
        });

        /* eslint-disable */
        for (const migration of migrationsDown) {
            logger.debug(`Migrate down: ${migration.fileName}`);
            await migration.module.down(this.db);
        }

        for (const migration of migrationsUp) {
            logger.debug(`Migrate up: ${migration.fileName}`);
            await migration.module.up(this.db);
        }
        /* eslint-enable */
    }

    parseHandlerFolder() {
        const { handlerFolder } = this.config.server;
        const filePathList = walk(handlerFolder, handlerFolder);

        const handlerList = filePathList.map((file) => {
            const module = require(file.absoluteFilePath); // eslint-disable-line
            const handler = typeof module === 'function' ? module : module.handler;
            return { method: file.name, route: file.dir, handler };
        });

        return handlerList;
    }

    parseQueryFolder() {
        const { queryFolder } = this.config.server;
        if (!this.db || !queryFolder) return {};
        const queryPathList = walk(queryFolder, queryFolder);
        const queryList = {};

        queryPathList.forEach((file) => {
            const camelCasedName = toCamelCase(file.name);
            const query = require(file.absoluteFilePath); // eslint-disable-line
            queryList[camelCasedName] = query(this.db);
        });

        return queryList;
    }

    buildServices() {
        const { services } = this.config;
        const entries = Object.entries(services || {});
        const serviceList = {};

        entries.forEach(([name, config]) => {
            serviceList[name] = axios.create(config);
        });

        return serviceList;
    }

    async start() {
        await this.applyMigrations();
        const handlerList = this.parseHandlerFolder();
        const queryList = this.parseQueryFolder();
        const services = this.buildServices();
        await this.frameworkAdapter.setupHandlers(handlerList, queryList, services);
        return this.frameworkAdapter.start();
    }

    async stop() {
        return this.frameworkAdapter.stop();
    }
};

module.exports = Service;
