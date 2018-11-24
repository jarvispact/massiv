const axios = require('axios');
const createConfig = require('./create-config');

const config = createConfig();
const { host, port } = config.server;

module.exports = axios.create({
    baseURL: `http://${host}:${port}/`,
    timeout: 1000,
    validateStatus: () => true,
});
