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
        console.log('Onboarding Nest Hub');

        // this comes from the onboardFlow property 
        // as part of the schema and manifest.xml
        var params = 'client_id=' + authInfo[0].client_id;
        params = params + '&code=' + authInfo[1];
        params = params + '&client_secret=' + authInfo[0].client_secret;
        params = params + '&grant_type=authorization_code';

        // build request URI
        var requestUri = 'https://api.home.nest.com/oauth2/access_token?' + params;
        var method = 'POST';

        // Set the headers
        var headers = {
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
                console.log(tokenInfo);
                return new accessTokenInfo(
                    tokenInfo.access_token,
                    add2CurrentUTC(tokenInfo.expires_in)
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