const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const readdir = promisify(fs.readdir);
const {emptyDirectory} = require('../globalFuncs');
console.log('readdir: ', readdir);

emptyDirectory('sharedFiles', true);
