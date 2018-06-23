const walk = require('./walk');

const filterSpecsFiles = file => !file.name.includes('.specs');

const mapFileToHandlerObject = (file) => ({
    method: file.name,
    route: file.dir,
    handler: require(file.absoluteFilePath), // eslint-disable-line
});

module.exports = (handlerFolderPath) => {
    const fileList = walk(handlerFolderPath);
    return fileList.filter(filterSpecsFiles).map(mapFileToHandlerObject);
};
