const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const readdir = promisify(fs.readdir);

async function emptyDirectory(startPath, origin=false) {
    console.log('startPath: ', startPath);
    try {
        // {err, names} = await readdir('path/to/dir');
        let err, files = await readdir(startPath);
        // await fs.readdir(startPath, async (err, files) => {
            console.log('HEAD: ', startPath);
            if (err) throw err;        
            for (const file of files) {
                let subPath = startPath + '/' + file;
                if (fs.lstatSync(subPath).isDirectory()) {
                    // console.log('DIRECTORY: ', subPath);
                    await emptyDirectory(subPath, false);
                }
                else {
                    console.log('FILE: ', subPath);
                    await fs.unlink(subPath);
                }
            }
            if (fs.lstatSync(startPath).isDirectory() && !origin) {
                console.log('   DELETING DIRECTORY: ', startPath);
                await fs.rmdir(startPath);        
            }                    
            console.log('TAIL: ', startPath);
    }
    catch(err) {
    }
} 

module.exports = {emptyDirectory};

// emptyDirectory('sharedFiles', true);
