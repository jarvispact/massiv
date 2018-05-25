const { errorWithCode } = require('../../../spec-helpers');

module.exports = async () => {
    throw errorWithCode('badRequest', 'test error', 'E_BAD_REQUEST');
};

module.exports.config = { auth: false };
