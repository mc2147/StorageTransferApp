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

// router.get('/show-videos', function (req, res) {
// 	res.json(getVideos(VideosJSON, thisUser.level));
// });

let dropboxKey = 'epwdjzc8m64ek7p';
let dropboxSecret = 'fp10lmyg6sqh1qa';

let redirectURIs = {
    dropbox: {
        1: 'http://localhost:3000/auth/dropbox/1',
        2: 'http://localhost:3000/auth/dropbox/2',
    },
    'google-drive': {        
        1: 'http://localhost:3000/auth/google-drive/1',
        2: 'http://localhost:3000/auth/google-drive/2',        
    }
}


router.put('/unlink-1', function(req, res) {
    req.session.auth1 = false;
    req.session.token1 = '';
    req.session.provider1 = '';
    req.session.accountID1 = '';
    res.json(req.session);
})

router.post('/auth', function(req, res) {
    console.log('LINE 30');
    let accountNum = parseInt(req.body.accountNum);
    let redirectURI = "";
    let thisProvider = "";
    let {provider1, provider2} = req.body; 
    if (accountNum == 1) {
        redirectURI = 'http://localhost:3000/api/auth-1';
        thisProvider = provider1;
    }
    else if (accountNum == 2) {
        redirectURI = 'http://localhost:3000/api/auth-2';  
        thisProvider = provider2;      
    }
    console.log('auth req.body: ', req.body);
    console.log("redirectURI: ", redirectURI);
    if (thisProvider == 'dropbox') {
        var dropbox = new Dropbox({ 
            clientId: dropboxKey,
            clientSecret: dropboxSecret
        });
        var authURL = dropbox.getAuthenticationUrl(
            // 'http://localhost:3000/auth',
            redirectURI,
            null,
            // 'test', 
            'code'
        );                
        res.json({
            authURL,
        });
        return
    }
    else if (thisProvider == 'googledrive') {
        const {client_secret, client_id, redirect_uris} = googledrive_secrets;
        // console.log("google drive API: ", redirect_uris[1]);
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[2]
        );
        //
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
    res.json("auth post route");
})

// Direction
// Provider 1, Provider 2
// from req.session: access token
router.post('/transfer', async function(req, res) {
    
})

router.get('/auth/google-drive/:id', async function(req, res) {
    console.log("/auth/google-drive route hit. req.query: ", req.query);
    let code = req.query.code;
    console.log("code: ", code);
    const {client_secret, client_id, redirect_uris} = googledrive_secrets;    
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[2]
    );
    oAuth2Client.getToken( code, async (err, token) => {
        if (err) console.log('err: ', err);
        console.log("token: ", token);
        oAuth2Client.setCredentials(token);
        console.log('\n\n auth/google-drive/:id oAuth2Client: ', 
        // oAuth2Client, 
        '\n\n');
        const drive = google.drive({version: 'v3', auth:oAuth2Client});
        // google.about.get({
        //     fields:'user'            
        // });
        const drive2 = google.drive({version: 'v2', auth:oAuth2Client});
        // const request = 
        drive.about.get({
            fields:'user'
        }, function(err, info) {
            console.log('user info: ', info.data);
            req.session.accountInfo1 = {
                name:info.data.user.displayName,
                email:info.data.user.emailAddress
            }
            drive.files.list({
                pageSize: 100,
                fields: 'nextPageToken, files(id, name, mimeType)',
                orderBy: 'viewedByMeTime desc'
              }, (err, {data}) => {
                let fileList1 = [];
                let folderList1 = [];
                if (err) return console.log('The API returned an error: ' + err);
                const files = data.files;
                if (files.length) {
                  console.log('\nFiles:');
                  files.map((file) => {
                    console.log(`${file.name} (${file.id})`);
                    if (file.mimeType == 'application/vnd.google-apps.folder') {
                        folderList1.push({
                            name:file.name,
                            tag:file.id
                        })
                    }
                    else {
                        fileList1.push({
                            name:file.name,
                            tag:file.id                            
                        })
                    }
                  });
                } else {
                  console.log('No files found.');
                }
                req.session.folderList1 = folderList1;
                req.session.fileList1 = fileList1;
                req.session.auth1 = true;
                req.session.token1 = token;
                req.session.provider1 = 'Google Drive';
                req.session.driveToken = token;
                // console.log('req.session before redirect: ', req.session);
                res.redirect('http://localhost:3000');    
                return
            });
        });
      });
})

router.get('/auth-1', async function(req, res) {
    console.log("auth-1 HIT. req.query: ", req.query);
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
        redirect_uri:'http://localhost:3000/api/auth-1',
    }
    console.log("postBody: ", postBody);
    let tokenResponse = {};
    try {
        tokenResponse = await axios.post(
            'https://api.dropboxapi.com/1/oauth2/token',
            qs.stringify(postBody),
            {
                // auth:{
                //     username:dropboxKey,
                //     password:dropboxSecret
                // },
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
    let accountID1 = tokenResponse.data.account_id;
    var dropbox = new Dropbox({ 
        accessToken,
    });
    // var dbx2 = new Dropbox({ 
    //     accessToken:accessToken,
    // });
    let fileList1 = [];
    let folderList1 = [];
    let dropboxQuery = await dropbox.filesListFolder({path: ''});
    console.log('dropboxQuery: ', dropboxQuery);
    dropboxQuery.entries.forEach(item => {
        if (item['.tag'] == 'file') {
            fileList1.push({
                name:item.name,
                tag:item.path_lower
            })
        }
        else if (item['.tag'] == 'folder') {
            folderList1.push({
                name:item.name,
                tag:item.path_lower
            })                    
        }
    })
    //   .catch(function(error) {
    //     // console.log(error);
    //   });      
    req.session.authenticated = true;
    req.session.auth1 = true;
    req.session.token1 = accessToken;
    req.session.provider1 = 'Dropbox';
    req.session.accountID1 = accountID1;
    req.session.fileList1 = fileList1;
    req.session.folderList1 = folderList1;
    try {
        let accountInfo = await axios.post(
            'https://api.dropboxapi.com/2/users/get_account',
            {
                account_id:accountID1,
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
        req.session.accountInfo1 = {
            name:accountInfo.data.name.display_name,
            email:accountInfo.data.email
        }
        console.log("account Info 1: ", accountInfo.data);
    }
    catch(error) {
        console.log("account info error: ", error);
    }
    // req.session.accountInfo1 = 
    console.log("req.session: ", req.session);        
    res.redirect('http://localhost:3000');    
})


router.get('/auth-status', function (req, res) {
    if (!req.session.fileList1) {
        req.session.fileList1 = [];
    }
    if (!req.session.folderList1) {
        req.session.folderList1s = [];        
    }
    res.json(req.session);  
})

router.get('/download/:id', async function(req, res) {
    let accessToken = req.session.accessToken;
    res.json("downloading:");
})

router.get('/copy/:index', async function(req, res) {
    // console.log('COPY ROUTE');
    // res.json('copy route');
    // return
    const {client_secret, client_id, redirect_uris} = googledrive_secrets;    
    const driveClient = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[2]
    );
    driveClient.setCredentials(req.session.driveToken);
    const drive = google.drive({
        version: 'v3',
        auth: driveClient
    });
    drive.about.get({
        fields:'user'
    }, function(err, info) {
        console.log('COPY info: ', info.data);
    })
    
    let accessToken = req.session.accessToken;
    console.log('req.session: ', req.session);
    let index = parseInt(req.params.index);
    if (!accessToken) {
        accessToken = '-AgBWYpnwwEAAAAAAABnf4YNjQ06U1sImV6POrRy91CM2taO4eSJVhbDpqZb0jzm';
    }
    var dbx2 = new Dropbox({ 
        accessToken,
        // accessToken: '-AgBWYpnwwEAAAAAAABnf4YNjQ06U1sImV6POrRy91CM2taO4eSJVhbDpqZb0jzm' 
        // -AgBWYpnwwEAAAAAAABnkKqVQsX2Vs7HhInptoqjJsE
    });
    let fileList = await dbx2.filesListFolder({path: ''});    
    // console.log("fileList: ", fileList);
    let selectedFile = fileList.entries[index];
    console.log('selectedFile: ', selectedFile);
    let filesRelocationArg = {
        from_path:selectedFile.path_lower,
        to_path:'/testAPI',
        allow_shared_folder:true,
        autorename:true,
        allow_ownership_transfer:true
    }
    try {
        await dbx2.filesCopy(filesRelocationArg);
        console.log('selectedFile: ', selectedFile);
        if (selectedFile['.tag'] == 'folder') {
            let folderDLpath = selectedFile.path_lower;
            console.log('downloading folder: ', selectedFile.path_lower);
            let folderDL = await dbx2.filesDownloadZip({path:folderDLpath});
            console.log('folderDL result: ', folderDL);
            await fs.writeFile(
                'sharedFiles/' + 
                folderDL.metadata.name + '.zip', 
                folderDL.fileBinary, 
                'binary', (err) => {
                if (err) throw err;
                console.log("folder written!!");
            });

            let folderName = folderDL.metadata.name + '.zip';
            let folderPath = path.join(__dirname, '/../sharedFiles/'+ folderName);
            
            const driveUpload = await drive.files.create({
                requestBody: {
                  // a requestBody element is required if you want to use multipart
                },
                // resource:
                // fileMetadata,
                resource: {
                    name:folderName,
                },
                media: {
                //   body: read,
                  body: fs.createReadStream(folderPath)
                }
              }, {
                // Use the `onUploadProgress` event from Axios to track the
                // number of bytes uploaded to this point.
                onUploadProgress: evt => {
                  const progress = (evt.bytesRead / fileSize) * 100;
                  process.stdout.clearLine();
                  process.stdout.cursorTo(0);
                  process.stdout.write(`${Math.round(progress)}% complete`);
                }
            });            
        }
        console.log("files copied?");
        // let dlpath = selectedFile.path_lower;
        // let dlpath = '/app.js';
        let dlpath = '/Fear.jpg';
        console.log ('dlpath: ', dlpath)
        let DL = await dbx2.filesDownload({path:dlpath});
        // console.log("DL: ", DL);
        await fs.writeFile(
            'sharedFiles/' + 
            DL.name, DL.fileBinary, 'binary', (err) => {
            if (err) throw err;
            console.log("file written!!");
        });
        // Uploading to google drive
        let fileName = path.join(__dirname, '/../sharedFiles/'+ DL.name);
        console.log('fileName: ', fileName, '\n', 'DL.name: ', DL.name);
        let fileReadStream = await fs.createReadStream(fileName);
        console.log('fileReadStream: ', fileReadStream);
        // let 
        await fs.readFile(path.join(__dirname, '/../sharedFiles/'+ DL.name), async function(err, read) {
            if (err) throw err;
            console.log("89");
            console.log("read: ", read);
            var fileMetadata = {
                'name': DL.name
            };
            console.log('fileMetadata: ', fileMetadata);
            const driveUpload = await drive.files.create({
                requestBody: {
                  // a requestBody element is required if you want to use multipart
                },
                resource:fileMetadata,
                // resource: {
                //     name:DL.name,
                // },
                media: {
                //   body: read,
                  body: fs.createReadStream(fileName)
                }
              }, {
                // Use the `onUploadProgress` event from Axios to track the
                // number of bytes uploaded to this point.
                onUploadProgress: evt => {
                  const progress = (evt.bytesRead / fileSize) * 100;
                  process.stdout.clearLine();
                  process.stdout.cursorTo(0);
                  process.stdout.write(`${Math.round(progress)}% complete`);
                }
            });
            // console.log('RES.DATA FROM DRIVE FILE CREATE: ', res.data);
    

            try {
                let UL = await dbx2.filesUpload({
                    contents:read,
                    path: '/newUploadTests/' + DL.name,
                    // mode:{
                    //     '.tag':'add',
                    // },
                    // autorename:true,
                    // mute:false
                });
                console.log('100');
                console.log("UL: ", UL);
                res.json({
                    // DL, 
                    UL
                });
                return
            }
            catch(err) {
                console.log('error 96: ', err);
            }
            // // console.log('readFile: ', readFile); 
        });        
    }
    catch (error) {
        console.log("error: ", error);
    }
    // filesCopy
    // res.json({
    //     accessToken
    // });
})

router.get('/auth', async function(req, res) {
    console.log("/auth route hit. req.query: ", req.query);
    let accessCode = req.query.code;
    console.log("accessCode: ", accessCode);
    let postBody = {
        code:accessCode,
        grant_type:'authorization_code',
        client_id:dropboxKey,
        client_secret:dropboxSecret,
        redirect_uri:'http://localhost:3000/auth',
        // baseURL:'http://localhost:3000/auth'             
    }
    // axios.setBaseURL('http://localhost:3000/auth');
    console.log("postBody: ", postBody);
    // let tokenResponse = await axios.post('https://api.dropboxapi.com/1/oauth2/token',
    // postBody);
    let tokenResponse = {};
    try {
        tokenResponse = await axios.post(
            'https://api.dropboxapi.com/1/oauth2/token',
            qs.stringify(postBody),
            {
                // auth:{
                //     username:dropboxKey,
                //     password:dropboxSecret
                // },
                headers:{
                    'content-type': 'application/x-www-form-urlencoded'
                }
        });
        // tokenResponse = await axios({
        //     method: 'post',
        //     // url: 'https://api.dropboxapi.com/1/oauth2/token',
        //     url: 'https://api.dropboxapi.com/1/oauth2/token',
        //     data: {
        //         grant_type:'authorization_code'},
        //     baseURL:'http://localhost:3000/auth',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         // 'Authorization': 'Basic ' + 
        //     },
        //     auth: {
        //         username:dropboxKey,
        //         password:dropboxSecret
        //     }
        // });
        console.log("tokenResponse.data: ", tokenResponse.data);
    }
    catch(error) {
        console.log("error: ", error);
    }
    let accessToken = tokenResponse.data.access_token;
    var dbx2 = new Dropbox({ 
        accessToken,
        // accessToken: '-AgBWYpnwwEAAAAAAABnf4YNjQ06U1sImV6POrRy91CM2taO4eSJVhbDpqZb0jzm' 
        // -AgBWYpnwwEAAAAAAABnkKqVQsX2Vs7HhInptoqjJsE
    });
    // var dbx2 = new Dropbox({ 
    //     accessToken:accessToken,
    // });
    dbx2.filesListFolder({path: ''})
      .then(function(response) {
        // console.log(response);
      })
      .catch(function(error) {
        // console.log(error);
      });
      
    req.session.authenticated = true;
    req.session.accessToken = accessToken;
    console.log("req.session: ", req.session);        
    res.json({
        status:"auth route hit!",
        // accessToken
    });
})

router.get('/', function(req, res)  {
    var CLIENT_ID = '42zjexze6mfpf7x';
    // var CLIENT_ID = '1070733238864-652r6f0kubc9vqrhoper8v1ubadgcolm.apps.googleusercontent.com';
    var dbx = new Dropbox({ 
        clientId: 'epwdjzc8m64ek7p',
        clientSecret: dropboxSecret
    });
    var authUrl = dbx.getAuthenticationUrl(
        'http://localhost:3000/auth',
        // 'http://localhost:3000/',
        null,
        // 'test', 
        'code'
    );    
    // var dbx2 = new Dropbox({ 
    //     accessToken: '-AgBWYpnwwEAAAAAAABnf4YNjQ06U1sImV6POrRy91CM2taO4eSJVhbDpqZb0jzm' });
    // dbx2.filesListFolder({path: ''})
    //   .then(function(response) {
    //     console.log(response);
    //   })
    //   .catch(function(error) {
    //     console.log(error);
    //   });
        // res.json({"testing":"testing"});
    res.redirect(authUrl);
    // res.send("testing 2");
});


module.exports = router;