const Boom = require('boom');

module.exports = async () => {
    throw Boom.internal('test error');
};

module.exports.config = { auth: false };
