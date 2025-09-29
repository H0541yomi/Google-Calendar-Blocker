# Google-Calendar-Blocker
An extension that automatically connects to Google Calendar to block distracting websites when you have work blocks scheduled.

# Note:
Since this extension is not published on the Chrome Extension store, I will need to manually give access to anyone who wants to use it. I will do my best to grant access to anyone who wants it, but you are free to download the extension and get your own Google Calendar API credentials to use the extension by yourself.

# Installation Instructions
1. Download the zip file. (Code -> Download ZIP)
2. Unzip the file.
3. Navigate to chrome://extensions. (This url works in any chromium based browser)
4. Turn on developer mode.
5. Click "Load Unpacked", and navigate to the unzipped file.
6. You are done! Log into google and then configure your settings to block websites to your liking.

# Getting your own API credentials
(You will need a code editor for this)
1. Navigate to console.cloud.google.com
2. In the top left corner, click "Select a project". (This might show the name of a different project if you have worked with Google Cloud Console before)
3. Click "New Project", and create a project.
4. At the top of the page, search for Google Calendar API. Navigate to the API page, and click "Enable".
5. Navigate back to your project, and then go to the credentials tab using the menu on the left. Click "Create Credentials" and choose "OAuth client ID". You might need to create a consent screen to create an OAuth client, so go through the dialogue if necessary.
6. When creating credentials, choose "Web Application".
7. Go to chrome://extensions, look for this extension, and then click "Details". Copy the ID.
8. Go back to creating credentials. In "Authorized Redirect URIs", paste https://{YOUR EXTENSION ID HERE}.chromiumapp.org, and then click "Save".
9. You should now have an OAuth client. Under actions, click the download button ("Download OAuth Client") and get the Client ID and the Client Secret.
10. Open the extension in a code editor, then go to /config.json. Replace the placeholders for client_id and client_secret with your own Client ID and Client Secret.
11. Go back to Google Cloud Console, and click "OAuth Consent Screen" -> "Audience" using the menu on the left. Add your google account to the list of test users. 
12. Go back to chrome://extensions, and hit the refresh button to update the extension with your OAuth credentials. Now you can use the extension freely!
