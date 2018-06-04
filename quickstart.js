const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const googleDriveSecrets = require('./googledrive_secrets');

// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'credentials.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  console.log("\n\ncontent: ", JSON.parse(content));
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(googleDriveSecrets, listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = googleDriveSecrets;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[2]);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    // console.log('\n\nerr, token line 30: ', err, 'token: ' + token, 
    // 'json.parse token: ', JSON.parse(token));
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('\nline 32 callback');
    // callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    const {client_secret, client_id, redirect_uris} = googleDriveSecrets;

    let newClient = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[2]
    );
    
    newClient.getToken(code, (err, token) => {
      if (err) return callback(err);
      newClient.setCredentials(token);
      // Store the token to disk for later program executions
      // fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      //   if (err) console.error(err);
      //   console.log('Token stored to', TOKEN_PATH);
      // });
      console.log('line 62 callback');
      // callback(newClient);
      // let parsedClient = JSON.parse(newClient);
      const drive = google.drive({version: 'v3', auth:newClient});
      // let driveFiles = await 
      drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
      }, (err, {data}) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = data.files;
        if (files.length) {
          console.log('\nFiles:');
          files.map((file) => {
            console.log(`${file.name} (${file.id})`);
          });
        } else {
          console.log('No files found.');
        }
      });
          
    });
  });
}

// OAuth2Client {
//   domain: null,
//   _events: {},
//   _eventsCount: 0,
//   _maxListeners: undefined,
//   transporter: DefaultTransporter {},
//   credentials: 
//    { access_token: 'ya29.GlvQBVdFf3quYhHkHtuzgc_uOAeTP3RvrL7HoDfPI_X8CYYqXOsWyfBoYhDZ59aQFHsqvEhluWgTqJLuQbuOwUJweNvkLCFO3lMuvH5oJUGaUHKbEqZTa5YV6qot',
//      token_type: 'Bearer',
//      expiry_date: 1528076666356 },
//   certificateCache: null,
//   certificateExpiry: null,
//   refreshTokenPromises: Map {},
//   _clientId: '132403385836-0ohn39d8h48qbjhpfbhep7ulq1uc7aiq.apps.googleusercontent.com',
//   _clientSecret: 'RYZtDp-42LBPPybBnMNFGwc_',
//   redirectUri: 'http://localhost:3000/api/auth/google-drive/1',
//   authBaseUrl: undefined,
//   tokenUrl: undefined,
//   eagerRefreshThresholdMillis: 300000 }

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles(auth) {
  console.log('\nauth line 98: ', auth);
  // Cannot destructure property `data` of 'undefined' or 'null'.

  const drive = google.drive({version: 'v3', auth});
  // let driveFiles = await 
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, {data}) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = data.files;
    if (files.length) {
      console.log('\nFiles:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}