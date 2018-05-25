const fs = require('fs');
const path = require('path');

const walk = (folder, initialFolder) => {
    let filePathList = [];
    const files = fs.readdirSync(folder);

    files.forEach((file) => {
        const absoluteFilePath = path.join(folder, file);
        const stats = fs.lstatSync(absoluteFilePath);
        const isDir = stats.isDirectory();
        if (isDir) {
            const newFolder = path.join(folder, file);
            const subList = walk(newFolder, initialFolder || folder);
            filePathList = filePathList.concat(subList);
        } else {
            const pathParts = absoluteFilePath.split(new RegExp(initialFolder || folder));
            const parsed = path.parse(pathParts[1]);
            const { dir, base, name, ext } = parsed;
            filePathList.push({ absoluteFilePath, dir, base, name, ext });
        }
    });

    return filePathList;
};

module.exports = walk;
