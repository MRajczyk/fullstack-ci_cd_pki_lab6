const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authedGoogle = false;
var userCredential;

app.get('/', (req, res) => {
    if (!authedGoogle) {
        var response = `<form action='/auth-google' method='post'>
                            <button>Login with google</button>
                        </form>
                       `
        res.send(response);
    } 
    else if(authedGoogle) {
        var oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
		oauth2.userinfo.v2.me.get(function(err, result) {
			if(err) {
				console.log('error');
			} else {
				loggedUser = result.data.name;
				console.log(loggedUser);
			}
			res.send(`Logged in: '.concat(loggedUser, '<img src ="', result.data.picture, '"height="23" width="23"><br>
                        <form action='/logout-google' method='post'>
                            <button>Log-out</button>
                        </form>
            `);
		})
	}
})

app.post('/auth-google', (req, res) => {
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile'
    });
    console.log(url)
    res.redirect(url);
})

app.post('/logout-google', (req, res) => {
    let postData = "token=" + userCredential.access_token;

    // Options for POST request to Google's OAuth 2.0 server to revoke a token
    let postOptions = {
    host: 'oauth2.googleapis.com',
    port: '443',
    path: '/revoke',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
    };

    // Set up the request
    const postReq = https.request(postOptions, function (res) {
    res.setEncoding('utf8');
    res.on('data', d => {
        console.log('Response: ' + d);
    });
    });

    postReq.on('error', error => {
        console.log(error)
    });

    // Post the request with data
    postReq.write(postData);
    postReq.end();

    authedGoogle = false;
    req.redirect('/');
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authedGoogle = true;
                res.redirect('/')
                userCredential = tokens;
            }
        });
    }
});

const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));