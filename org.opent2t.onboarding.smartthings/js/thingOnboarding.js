'use strict';
var request = require('request-promise');
var accessTokenInfo = require('./common').accessTokenInfo;

function add2CurrentUTC(seconds) {
    var t = parseInt(Math.floor(new Date().getTime() / 1000));
    t += parseInt(seconds);
    return t;
}

class Onboarding {

    onboard(authInfo) {
        console.log('Onboarding SmartThings Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = 'grant_type=authorization_code&client_id=' + authInfo[0].client_id
                   + '&client_secret=' + authInfo[0].client_secret
                   + '&redirect_uri=' + authInfo[0].redirect_url
                   + '&code=' + authInfo[1]
                   + '&scope=app';

        // build request URI
        var requestUri = 'https://graph.api.smartthings.com/oauth/token?' + params;
        var method = 'POST';

        // Set the headers
        var headers = {
            'Accept': 'application/json',
            'cache-control': 'no-cache'
        }

        var options = {
            url: requestUri,
            method: method,
            headers: headers,
            followAllRedirects: true
        };

        return request(options)
            .then(function (body) {
                var tokenInfo = JSON.parse(body); // This includes refresh token, scope etc..
                return new accessTokenInfo(
                    tokenInfo.access_token,
                    authInfo[0].client_id,
                    tokenInfo.token_type,
                    add2CurrentUTC(tokenInfo.expires_in),
                    tokenInfo.scope
                );
            })
            .catch(function (err) {
                console.log('Request failed to: ' + options.method + ' - ' + options.url);
                console.log('Error            : ' + err.statusCode + ' - ' + err.response.statusMessage);
                // todo auto refresh in specific cases, issue 74
                throw err;
            });
    }
}

module.exports = Onboarding;