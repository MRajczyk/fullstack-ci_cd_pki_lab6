const { google } = require('googleapis');
const https = require('https');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()


//////////////////////////////////////GOOGLE//////////////////////////////////////////////////////////////////
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const CLIENT_ID_GITHUB = "05f7d8738e47d345f54e";
const CLIENT_SECRET_GITHUB = "c68a2ed343807e61ff341d1f09aed820e54ea2fb"

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authedGoogle = false;
var authedGithub = false;
var userCredential;
var githubAccessToken;

app.get('/', (req, res) => {
    if (!authedGoogle && !authedGithub) {
        var response = `<form action='/auth-google' method='post'>
                            <button>Login with google</button>
                        </form>
                        <a href="https://github.com/login/oauth/authorize?client_id=${CLIENT_ID_GITHUB}>" Github Login</a>
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
			res.send('Logged in: '.concat(loggedUser, '<img src ="', result.data.picture, '"height="23" width="23">'.concat`<br>
                        <form action='/logout-google' method='post'>
                            <button>Log-out</button>
                        </form>
            `));
		})
	}
    else if(authedGithub) {
        res.send('<p>Authorized with github!</p>'//.concat`<br>
                    //<form action='/logout-github' method='post'>
                    //   <button>Log-out</button>
                    //</form>`
            );
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
    res.redirect('/');
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

//////////////////////////////////////GITHUB//////////////////////////////////////////////////////////////////

app.get('/github/callback', (req, res) => {

    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code
    
    axios({
      method: 'post',
      url: `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID_GITHUB}&client_secret=${CLIENT_SECRET_GITHUB}&code=${requestToken}`,
      // Set the content type header, so that we get the response in JSON
      headers: {
           accept: 'application/json'
      }
    }).then((response) => {
      githubAccessToken = response.data.access_token
      res.redirect('/');
    })
})

const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));