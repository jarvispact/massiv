module.exports = async () => {
    throw new Error('test error');
};

module.exports.config = { auth: false };
