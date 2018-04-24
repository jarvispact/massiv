const Boom = require('boom');

module.exports.handler = async () => {
    throw Boom.badRequest('some error');
};
