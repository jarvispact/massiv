const axios = require('axios');
const serviceConfig = require('./service-config');

module.exports = axios.create({
    baseURL: `http://${serviceConfig.server.host}:${serviceConfig.server.port}/`,
    timeout: 1000,
});
