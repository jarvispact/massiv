module.exports = ({ config }) => {
    if (!config) throw new Error('missing option: "config"');
    if (!config.server) throw new Error('missing option: "config.server"');

    const { host, port, handlerFolder } = config.server;
    if (!host) throw new Error('missing option: "config.server.host"');
    if (!port) throw new Error('missing option: "config.server.port"');
    if (!handlerFolder) throw new Error('missing option: "config.server.handlerFolder"');
    return true;
};
