const { HTTPError } = require('../../../');

module.exports = async () => {
    throw HTTPError('badRequest', 'a boom error', 'E_BOOM_ERROR', { foo: 'bar' });
};
