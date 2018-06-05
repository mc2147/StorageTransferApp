This application allows you to link two Google Drive or Dropbox storage accounts and copy files/folders from one account to another.

<b>Setup:</b>

1. From root folder directory, run 'npm install'

2. Run 'npm start' and head to http://localhost:3000/ to view app

3. To clear the storage folder 'sharedFiles', run 'npm run empty' (recursive script that empties the folder)

<b>Instructions:</b>

1. Select your providers and link two accounts under 'Storage Account 1' and 'Storage Account 2'.

2. Select the source account to copy files from under 'Select Source Account' in 'File Transfer'

3. Select the source folder of file to copy from under 'Select Source File or Folder'

4. Select the destination account to copy files to under 'Select Destination Folder' OR enter a custom directory to create a new folder to copy items to

5. Click 'Transfer File' to begin transfer

<b>Functionality Status</b>

Full functionality is available for Dropbox-to-Dropbox transfers only for now. Dropbox-to-Dropbox folder transfers use a recursive download and upload function that recreates the source Dropbox directory on the local server, then uploads that directory onto the target Dropbox account (uploadDropboxFolder and saveDropboxFolder in '/api/index').

Dropbox-to-Google Drive transfers work with limited functionality - single files can be copied from Dropbox to Google Drive, but not folders.

To see example of full functionality:

1. Link two Dropbox accounts under Storage Account 1 and Storage Account 2

2. Select a folder with multiple subfolders and files under the subfolders

3. Enter a new folder name in 'enter a custom directory'

4. Click 'Transfer File'