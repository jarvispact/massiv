const walk = require('./walk');

module.exports = (handlerFolderPath) => {
    const fileList = walk(handlerFolderPath);

    const handlerList = fileList.map((file) => ({
        method: file.name,
        route: file.dir,
        handler: require(file.absoluteFilePath), // eslint-disable-line
    }));

    return handlerList;
};
