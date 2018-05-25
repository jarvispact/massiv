module.exports = async ({ params, query, body }) => ({ params, query, body });
module.exports.config = { auth: false, status: 201 };
