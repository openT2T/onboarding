'use strict';
var request = require('request-promise');

class Onboarding {

    onboard(authInfo) {
        console.log('Onboarding Insteon Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var postData = JSON.stringify({
            'client_id': authInfo[1].client_id,
            'username': authInfo[0].username,
            'password': authInfo[0].password,
            'grant_type': 'password'
        });

        // Set the headers
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            'Accept': 'application/json'
        }

        var options = {
            url: 'https://connect.insteon.com/api/v2/oauth2/token',
            method: 'POST',
            headers: headers,
            body: postData,
            followAllRedirects: true
        };

        return request(options)
            .then(function (body) {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..

                var expiration = Math.floor((new Date().getTime() / 1000) + tokenInfo.expires_in);

                var authTokens = {};
                authTokens['access'] = {
                    token: tokenInfo.access_token,
                    expiration: expiration, 
                    type: tokenInfo.token_type,
                    client_id: authInfo[1].client_id
                };

                authTokens['refresh'] = {
                    token: tokenInfo.refresh_token,
                    expiration: expiration
                };

                return authTokens;
            })
            .catch(function (err) {
                console.log("Request failed to: " + options.method + " - " + options.url);
                console.log("Error            : " + err.statusCode + " - " + err.response.statusMessage);
                // todo auto refresh in specific cases, issue 74
                throw err;
            });
    }
}

module.exports = Onboarding;