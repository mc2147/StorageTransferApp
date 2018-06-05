const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
require('isomorphic-fetch'); // or another library of choice.
var Dropbox = require('dropbox').Dropbox;
const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
let googledrive_secrets = require('../googledrive_secrets');
console.log('googledrive_secrets: ', googledrive_secrets);
const {client_secret, client_id} = googledrive_secrets;    

// router.get('/show-videos', function (req, res) {
// 	res.json(getVideos(VideosJSON, thisUser.level));
// });

let dropboxKey = 'epwdjzc8m64ek7p';
let dropboxSecret = 'fp10lmyg6sqh1qa';

let redirectURIs = {
    dropbox: {
        1: 'http://localhost:3000/api/auth/dropbox/1',
        2: 'http://localhost:3000/api/auth/dropbox/2',
    },
    'google-drive': {        
        1: 'http://localhost:3000/api/auth/google-drive/1',
        2: 'http://localhost:3000/api/auth/google-drive/2',        
    }
}

router.put('/unlink/:aID', function(req, res) {
    console.log("unlink route: ", req.params.aID);
    req.session[`auth${req.params.aID}`] = false;
    req.session[`token${req.params.aID}`] = '';
    req.session[`provider${req.params.aID}`] = '';
    req.session[`accountID${req.params.aID}`] = '';
    req.session[`storageAccount${req.params.aID}`] = {};
    res.json(req.session);
})

// Initial AUTH POST
router.post('/auth', function(req, res) {
    let accountNum = parseInt(req.body.accountNum);
    let thisProvider = "";
    let {provider1, provider2} = req.body; 
    if (accountNum == 1) {
        thisProvider = provider1;
    }
    else if (accountNum == 2) {
        thisProvider = provider2;      
    }
    // return
    if (thisProvider == 'dropbox') {
        console.log('DROPBOX AUTH');
        let redirectURI = `http://localhost:3000/api/auth/dropbox/${accountNum}`;
        console.log("redirectURI: ", redirectURI);
        var dropbox = new Dropbox({ 
            clientId: dropboxKey,
            clientSecret: dropboxSecret
        });
        var authURL = dropbox.getAuthenticationUrl(
            redirectURI,
            null,
            'code'
        );                
        res.json({
            authURL,
        });
        return
    }
    else if (thisProvider == 'googledrive') {
        console.log('GOOGLE DRIVE AUTH');
        let redirectIndex = accountNum + 1;
        let redirectURI = redirectURIs['google-drive'][accountNum];
        console.log('redirectURI: ', redirectURI);
        const {client_secret, client_id} = googledrive_secrets;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirectURI
        );
        const authURL = oAuth2Client.generateAuthUrl({
            access_type:'offline',
            scope:['https://www.googleapis.com/auth/drive']
        });
        console.log("auth URL: ", authURL);
        res.json({
            authURL,
        });
        return
    }
    else if (thisProvider == 'onedrive') {
        
    }
    res.json("auth post route hit");
})

let path1exists = fs.existsSync('/sharedFiles');
let path2exists = fs.existsSync('sharedFiles/app1.js');
let path3exists = fs.existsSync('sharedFiles/app.js');
console.log('p1exists: ', path1exists);
console.log('p2exists: ', path2exists);
console.log('p3exists: ', path3exists);




console.log('\n\n');
// getDropboxFile('/my writing', '-AgBWYpnwwEAAAAAAABouxrEk_uW4mDWF9JlDvmEqVpz2yNtU5wsM1xyL4zWu9JD');
// uploadDropboxFolder('-AgBWYpnwwEAAAAAAABouxrEk_uW4mDWF9JlDvmEqVpz2yNtU5wsM1xyL4zWu9JD', 
// 'sharedFiles/My Writing', 
// '/june4thUploads', true);

// localPath: no / to start
// dropboxPath: / to start

// RECURSIVE FUNCTION THAT UPLOADS LOCAL FOLDER TO DROPBOX
async function uploadDropboxFolder(token, startingPath, dropboxPath, origin=true) {
    var dropbox = new Dropbox({ 
        accessToken:token,
    });    
    let startPath = startingPath;
    if (fs.lstatSync(startPath).isDirectory()) {
        console.log('DIRECTORY: ', startingPath, dropboxPath);
        try {//CHECK IF FILE DIRECTORY ALREADY EXISTS
            let checkMeta = await dropbox.filesGetMetadata({
                path:dropboxPath,
            });
        }
        catch (err) {
            await dropbox.filesCreateFolderV2({
                path:dropboxPath,
                autorename:true,
            });
        }
    }
    console.log('startPath: ', startPath);
    await fs.readdir(startPath, async (err, files) => {
        if (err) throw err;        
        for (const file of files) {
            let subPath = startPath + '/' + file;
            let subDropboxPath = dropboxPath + '/' + file;
            if (fs.lstatSync(subPath).isDirectory()) {
                uploadDropboxFolder(token, subPath, subDropboxPath, false);
            }
            else {
                console.log('FILE: ', subPath, subDropboxPath);
                await fs.readFile(subPath, 
                    async function(err, read) {
                        try {
                            let UL = await dropbox.filesUpload({
                                contents:read,
                                path: subDropboxPath,
                            });
                        }
                        catch(err) {
                            console.log('dropbox upload err: ', err);
                        }
                })
            }
        }
    }) 
}

// RECURSIVE FUNCTION THAT COPIES FOLDER STRUCTURE FROM DROPBOX
async function saveDropboxFolder(dropboxPath, token, origin=false, local='') {
    var dropbox = new Dropbox({ 
        accessToken:token,
    });    
    console.log('\n\ndropboxPath: ', dropboxPath);
    let nextFolderPaths = [];
    try {
        let metaData = await dropbox.filesGetMetadata({
            path:dropboxPath,
            include_media_info:true,
            include_deleted:true,
            include_has_explicit_shared_members:true,
        });
        // console.log('metaData: ', metaData, '\n\n');

        let oldlocalPath = 'sharedFiles/';
        let localPath = oldlocalPath + metaData.name + '/';
        if (origin) {
            if (!fs.existsSync(localPath)) {
                fs.mkdirSync(localPath);
            }                
        }        
        else {
            // console.log('NOT ORIGIN: ');
            // console.log('   dropboxPath: ', dropboxPath);
            // console.log('   local: ', local);
            if (!fs.existsSync(local)) {
                fs.mkdirSync(local);
            }                    
            let subfolderMetadata = await dropbox.filesGetMetadata({
                path:dropboxPath,
                include_media_info:true,
                include_deleted:true,
                include_has_explicit_shared_members:true,
            });
            // console.log('SUB-FOLDER METADATA: ', subfolderMetadata);
            localPath = local;
        }
        let fileList = await dropbox.filesListFolder({path:dropboxPath, recursive:true, limit:20});
        for (let i = 0; i < fileList.entries.length; i ++) {
            let entry = fileList.entries[i];
            if (i == 0) {
                continue;
            }
            if (entry['.tag'] == 'folder') {
                // console.log('SUB-FOLDER FOUND:');
                // console.log('   ', entry);
                let subfolderMetadata = await dropbox.filesGetMetadata({
                    path:entry.path_lower,
                    include_media_info:true,
                    include_deleted:true,
                    include_has_explicit_shared_members:true,
                });
                // console.log('SUB-FOLDER METADATA: ', subfolderMetadata);
                saveDropboxFolder(entry.path_lower, token, false, localPath + entry.name + '/');
                //Directory Path
                let newPath = 'sharedFiles/' + metaData.name + '/' + entry.name;
                if (!fs.existsSync(newPath)) {
                    // fs.mkdirSync(newPath);
                }                
                // let recursePath = 
                // Recursion here
                // console.log('new path: ', newPath);
            }
            else if (entry['.tag'] == 'file') {
                // console.log('FILE FOUND: ', entry.name);
                let DL = await dropbox.filesDownload({path:entry.path_display});
                // console.log('DL: ', DL);
                await fs.writeFile(
                    localPath + DL.name, 
                    DL.fileBinary, 'binary', (err) => {
                    if (err) throw err;
                    console.log("file written!!");
                });                        
            }
        }
    }
    catch(err) {
        console.log('saveDropboxFolder err: ', err);        
    }
}

async function getDropboxFile(thisPath, token) {
    console.log('getDropboxFile: ', thisPath, token);
    var dropbox = new Dropbox({ 
        accessToken:token,
    });
    try {
        let metaData = await dropbox.filesGetMetadata({
            path:thisPath,
            include_media_info:true,
            include_deleted:true,
            include_has_explicit_shared_members:true,
        });
        console.log('getDropboxFile file metadata: ', metaData);
        console.log("metaData['.tag']: ", metaData['.tag']);
        if (metaData['.tag'] == 'folder') {
            await saveDropboxFolder(thisPath, token, true);        
            let path1exists = fs.existsSync('/sharedFiles');
            let path2exists = fs.existsSync('/sharedFiles1');
            // return 
        }
        else {
            let DL = await dropbox.filesDownload({path:thisPath});                
            await fs.writeFile(
                'sharedFiles/' + DL.name, 
                DL.fileBinary, 'binary', (err) => {
                if (err) throw err;
                // console.log("file written!!");
            });                        
        }
        return metaData
    }
    catch (err) {
        console.log('err: ', err);
    }
}

function storeGoogleDriveFolder(path, token) {
    // if (!origin 
    //     && fs.lstatSync(_path).isDirectory()) {
    //         console.log('   rmdir _path: ', _path);
    //         fs.rmdir(_path);        
    //     }
}

// Google Drive Specific Auth
function getDriveAuthClient(token, accountNum) {
    let redirectURI = redirectURIs['google-drive'][accountNum];
    console.log('g-auth redirectURI: ', redirectURI);
    console.log('token: ', token);
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirectURI
    );
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

async function driveFileInfo(fileId, _drive) {
    const res = await _drive.files.get(
        {
            fileId, 
            // alt: 'media',
            fields:'data'
        }, function (err, response) {
            // console.l
            // console.log('driveFileInfo response:  ', response);
            return response
        });
    console.log('res from driveFileInfo: ', res);
}

function handleUpload (localPath, destprov, desttoken) {
    
}

// Use saveDriveFolder if folder
function getDriveFile(fileId, _drive, destprov, desttoken) {
    return _drive.files.get(
        {
            fileId, 
            // alt: 'media',
            // fields:'data'
        },
        // {responseType:'stream'},
        function(err, response) {
            console.log('get DriveFile err, response.data.name, mimeType: ', err,
                response.data.name,
                response.mimeType,
                response.data.mimeType
            );
            let name = response.data.name;
            let mimeType = response.data.mimeType;
            console.log('storedInfo pre: ', storedInfo);
            storedInfo.name = name;
            storedInfo.path = 'sharedFiles/' + name;
            console.log('storedInfo post: ', storedInfo);
            if (mimeType == 'application/vnd.google-apps.folder') {
                //Folder Upload
                // destprov, desttoken
                return
            }
            const dest = fs.createWriteStream('sharedFiles/' + name);    
            // let dest = 'sharedFiles/' + name;
            _drive.files.get(
            {
                fileId, alt:'media'
            },
            {
                responseType:'stream'
            }, function(err, stream) {
                stream.data.on('error', err => {
                    // done(err);
                }).on('end', (test) => {
                    console.log('test: ', test);
                    // done();
                })
                .pipe(dest);
                //  File Upload
                // destprov, desttoken
                    
                return
            })
        }
    )
    }

async function saveDriveFolder(fileId, _drive) {

}

async function uploadDriveFolder(path, token) {
    
}
async function runSample (fileId, drive) {
    return new Promise(async (resolve, reject) => {
      const filePath = 'sharedFiles';
      console.log(`writing to ${filePath}`);
      const dest = fs.createWriteStream(filePath);
      let progress = 0;
      const res = await drive.files.get(
        {fileId, alt: 'media'},
        {responseType: 'stream'}
      );
      res.data
        .on('end', () => {
          console.log('Done downloading file.');
          resolve(filePath);
        })
        .on('error', err => {
          console.error('Error downloading file.');
          reject(err);
        })
        .on('data', d => {
          progress += d.length;
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`Downloaded ${progress} bytes`);
        })
        .pipe(dest);
    });
  }

  async function checkSourceInfo() {
      if (storedInfo.name && storedInfo.path) {
          return true;
      }
  }
// Direction
// Provider 1, Provider 2
// from req.session: access token
// We want to: download file from source account, fs.readstream on file, then upload file to destination account
let storedInfo = {};
router.post('/transfer', async function(req, res) {
    let sourceNum = parseInt(req.body.sourceAccount);
    let {sourceID, destinationID, sourceAccount, customPath} = req.body;
    let destNum = 1;
    if (sourceNum == 1) {
        destNum = 2;
    }
    console.log('\n\ntransfer route: ', req.body);
    console.log("sourceAccountNum: ", sourceNum);
    // return //for testing
    let sourceProvider = req.session[`storageAccount${sourceNum}`].provider;
    let sourceToken = req.session[`storageAccount${sourceNum}`].token;
    console.log('source provider: ', sourceProvider);
    let destProvider = req.session[`storageAccount${destNum}`].provider;
    let destToken = req.session[`storageAccount${destNum}`].token;

    if (destinationID == 'root_dir') {
        destinationID = '';
    }
    
    let destPath = destinationID;
    console.log('destination provider: ', destProvider);
    let stored = {};
    let storedPath = '';
    let storedName = '';
    // let storedInfo = {};
    if (sourceProvider == 'Dropbox') {
        stored = await getDropboxFile(sourceID, sourceToken); //metadata
        storedPath = 'sharedFiles/' + stored.name;
        storedName = stored.name;
        storedInfo.path = 'sharedFiles/' + stored.name;
        storedInfo.name = stored.name;
    }
    else if (sourceProvider == 'Google Drive') {
        console.log('sourceToken, sourceNum: ', sourceToken, sourceNum);
        let authClient = getDriveAuthClient(sourceToken, sourceNum);
        const drive = google.drive({version: 'v3', auth:authClient});
        console.log('\n\nDrive source: ', sourceID);
        try {
            await driveFileInfo(sourceID, drive);
        }
        catch (err) {
            console.log('479 err');
        }
        stored = getDriveFile(sourceID, drive, destProvider, destToken);
        var currentTime = new Date().getTime();
        await checkSourceInfo();    
        return
    }
    console.log('\n\nSTORED PATH!!!: ', storedInfo.path);
    let storedIsFolder = fs.lstatSync(storedInfo.path).isDirectory();
    console.log('storedIsFolder ', storedIsFolder);    
    
    if (destProvider == 'Dropbox') {
        if (customPath) {
            destinationID = '/' + destinationID;
        }
        if (stored['.tag'] == 'folder') {
            uploadDropboxFolder(destToken, 
            storedInfo.path, 
            destinationID, 
            true);            
        }
        else if (stored['.tag'] == 'file') {
            let dropbox = new Dropbox({
                accessToken:destToken,
            })
            await fs.readFile(storedInfo.path, 
                async function(err, read) {
                    try {
                        let UL = await dropbox.filesUpload({
                            contents:read,
                            path: destinationID + '/' + storedInfo.name,
                        });
                    }
                    catch(err) {
                        console.log('dropbox upload err: ', err);
                    }
            })
        }
    }
    else if (destProvider == 'Google Drive') {
        let authClient = getDriveAuthClient(destToken, destNum);
        const drive = google.drive({version: 'v3', auth:authClient});
        
        console.log('\ndestProvider is Drive. authClient: ', authClient);
        if (storedIsFolder) {
            //uploadDriveFolder
        }
        else {
            let fileMetadata = {
                name:storedInfo.name,                
            }
            if (destinationID != '' && !customPath) {
                fileMetadata.parents = [destinationID];
            }
            else if (destinationID != '' && customPath) {
                // var fileMetadata = {
                //     'name': 'Invoices',
                //     'mimeType': 'application/vnd.google-apps.folder'
                //   };
                //   drive.files.create({
                //     resource: fileMetadata,
                //     fields: 'id'
                //   }, function (err, file) {
                //     if (err) {
                //       // Handle error
                //       console.error(err);
                //     } else {
                //       console.log('Folder Id: ', file.id);
                //     }
                //   });
                console.log('destinationID: ', destinationID);
                var folderMetadata = {
                    'name': destinationID,
                    'mimeType': 'application/vnd.google-apps.folder'
                };
                  drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                  }, function (err, folder) {
                    if (err) {
                      // Handle error
                      console.error(err);
                    } else {
                        console.log('folder: ', folder);
                      console.log('Folder Id: ', folder.data.id);
                      fileMetadata.parents = [folder.data.id];
                      let fileRS = fs.createReadStream(storedInfo.path);
                      console.log('fileRS: ', fileRS);
                      // let storedPath
                      const driveUpload = drive.files.create({
                          requestBody: {
                          },
                          resource: fileMetadata,
                          media: {
                            body: fileRS,
                          }
                        }, function(err, file) {
                            if (err) {console.log('drive upload err: ', err)}
                            else {console.log('drive upload: ', driveUpload)};
                          }
                        );          
                    }
                  });
                  res.json('finished');
                  return
            }
            let fileRS = fs.createReadStream(storedInfo.path);
            console.log('fileRS: ', fileRS);
            // let storedPath
            const driveUpload = drive.files.create({
                requestBody: {
                },
                resource: fileMetadata,
                media: {
                  body: fileRS,
                }
              }, function(err, file) {
                  if (err) {console.log('drive upload err: ', err)}
                  else {console.log('drive upload: ', driveUpload)};
                }
              );
        }
    }

    res.json('transfer route hit');
})

// DROPBOX AUTH REDIRECT
router.get('/auth/dropbox/:accountNum', async function(req, res) {
    let accountNum = parseInt(req.params.accountNum);
    let redirectURI = `http://localhost:3000/api/auth/dropbox/${accountNum}`;
    let accountKey = `storageAccount${accountNum}`;
    if ('error' in req.query) {
        res.json({
            error: true,
        })
        return
    }    
    let {code} = req.query;
    let postBody = {
        code,
        grant_type:'authorization_code',
        client_id:dropboxKey,
        client_secret:dropboxSecret,
        redirect_uri:redirectURI,
    }
    // GETTING ACCESS TOKEN
    let tokenResponse = {};
    try {
        tokenResponse = await axios.post(
            'https://api.dropboxapi.com/1/oauth2/token',
            qs.stringify(postBody),
            {
                headers:{
                    'content-type': 'application/x-www-form-urlencoded'
                }
        });
        console.log("tokenResponse.data: ", tokenResponse.data);
    }
    catch(error) {
        console.log("error: ", error);
    }
    let accessToken = tokenResponse.data.access_token;
    let accountID = tokenResponse.data.account_id
    let accountID1 = tokenResponse.data.account_id;
    var dropbox = new Dropbox({ 
        accessToken,
    });
    // var dbx2 = new Dropbox({ 
    //     accessToken:accessToken,
    // });
    let fileList = [];
    let folderList = [];
    let dropboxQuery = await dropbox.filesListFolder({path: ''});
    console.log('dropboxQuery: ', dropboxQuery);
    dropboxQuery.entries.forEach(item => {
        if (item['.tag'] == 'file') {
            fileList.push({
                name:item.name,
                tag:item.path_lower
            })
        }
        else if (item['.tag'] == 'folder') {
            folderList.push({
                name:item.name,
                tag:item.path_lower
            })                    
        }
    })

    // ACCOUNT-SPECIFIC INFORMATION
    if (accountNum == 1) {
        req.session.storageAccount1 = {
            authenticated:true,
            token:accessToken,
            provider:'Dropbox',
            accountID,
            fileList,
            folderList
        }
    }
    else if (accountNum == 2) {
        req.session.storageAccount2 = {
            authenticated:true,
            token:accessToken,
            provider:'Dropbox',
            accountID,
            fileList,
            folderList
        }
    }
    try {
        let accountInfo = await axios.post(
            'https://api.dropboxapi.com/2/users/get_account',
            {
                account_id:accountID,
            },
            {
                headers:{
                    'Authorization': 'Bearer ' + accessToken
                },
                // auth:{
                //     username:dropboxKey,
                //     password:dropboxSecret
                // },
            }
            );
        req.session[accountKey].accountInfo = {
            name:accountInfo.data.name.display_name,
            email:accountInfo.data.email
        }
        console.log(`account ${accountNum} info: `, accountInfo.data);
    }
    catch(error) {
        console.log("account info error: ", error);
    }
    // req.session.accountInfo1 = 
    console.log("req.session: ", req.session);        
    res.redirect('http://localhost:3000');    
})


// GOOGLE-DRIVE AUTH REDIRECT
router.get('/auth/google-drive/:id', async function(req, res) {
    let accountNum = parseInt(req.params.id);    
    let code = req.query.code;
    console.log("code: ", code, ' accountNum: ', accountNum);
    const {client_secret, client_id} = googledrive_secrets;    
    let redirectURI = redirectURIs['google-drive'][accountNum];
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirectURI
    );
    oAuth2Client.getToken( code, async (err, token) => {
        if (err) console.log('err: ', err);
        // console.log("token: ", token);
        oAuth2Client.setCredentials(token);
        // console.log('\n\n auth/google-drive/:id oAuth2Client: ', 
        // // oAuth2Client, 
        // '\n\n');
        const drive = google.drive({version: 'v3', auth:oAuth2Client});
        drive.about.get({
            fields:'user'
        }, function(err, info) {
            // console.log('user info: ', info.data);
            req.session.accountInfo1 = {
                name:info.data.user.displayName,
                email:info.data.user.emailAddress
            }
            let accountInfo = {
                name:info.data.user.displayName,
                email:info.data.user.emailAddress
            };
            drive.files.list({
                pageSize: 100,
                fields: 'nextPageToken, files(id, name, mimeType)',
                orderBy: 'viewedByMeTime desc'
              }, (err, {data}) => {
                let fileList = [];
                let folderList = [];
                if (err) return console.log('The API returned an error: ' + err);
                const files = data.files;
                if (files.length) {
                //   console.log('\nFiles:');
                  files.map((file) => {
                    // console.log(`${file.name} (${file.id})`);
                    if (file.mimeType == 'application/vnd.google-apps.folder') {
                        folderList.push({
                            name:file.name,
                            tag:file.id
                        })
                    }
                    else {
                        fileList.push({
                            name:file.name,
                            tag:file.id                            
                        })
                    }
                  });
                } else {
                  console.log('No files found.');
                }

                req.session[`storageAccount${accountNum}`] = {
                    authenticated:true,
                    token,
                    provider:'Google Drive',
                    fileList,
                    folderList,
                    accountInfo
                }
                        
                // console.log('req.session before redirect: ', req.session);
                res.redirect('http://localhost:3000');    
                return
            });
        });
      });
})

router.get('/auth-status', function (req, res) {
    // console.log('auth status route. req.session: ', req.session);
    if (!req.session.fileList1) {
        req.session.fileList1 = [];
    }
    if (!req.session.folderList1) {
        req.session.folderList1s = [];        
    }
    res.json(req.session);  
})


module.exports = router;