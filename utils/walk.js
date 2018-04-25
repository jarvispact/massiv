const fs = require('fs');
const path = require('path');

const walk = (currentFolder, initialFolder) => {
    let filePathList = [];
    const files = fs.readdirSync(currentFolder);

    files.forEach((file) => {
        const absoluteFilePath = path.join(currentFolder, file);
        const stats = fs.lstatSync(absoluteFilePath);
        const isDir = stats.isDirectory();
        if (isDir) {
            const newFolder = path.join(currentFolder, file);
            const subList = walk(newFolder, initialFolder);
            filePathList = filePathList.concat(subList);
        } else {
            const pathParts = absoluteFilePath.split(new RegExp(initialFolder));
            const parsed = path.parse(pathParts[1]);
            const method = parsed.name;
            const route = parsed.dir;
            const module = require(absoluteFilePath); // eslint-disable-line
            const handler = typeof module === 'function' ? module : module.handler;
            filePathList.push({ method, route, handler });
        }
    });

    return filePathList;
};

module.exports = walk;
