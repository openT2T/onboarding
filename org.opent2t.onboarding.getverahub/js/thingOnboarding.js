'use strict';
var https = require('https');
var cryptojs_sha1 = require('crypto-js');
var request = require('request-promise');

class Onboarding {

    ///
    /// gets the session token for the provided server url
    ///
    getSessionToken(url) {
        return this.makeVeraRequest(url, this.veraSessionTokenPath, false, false, this.mmsInfo, true);
    }

    ///
    /// gets the mms info for the user account
    ///
    getMmsAuthInfo() {
        var path = '/autha/auth/username/' + this.username + '?SHA1Password=' + this.sha1Password + '&PK_Oem=1';
        
        return this.makeVeraRequest(this.veraAccountUrl, path)
            .then((data) => {
                this.mmsInfo = data;
                return data;
            });
    }

    ///
    /// gets the device specific info, including the relay server with which to talk to devices through
    ///
    getDeviceInfo(url, sessionToken, pkDevice) {
        var path = '/device/device/device/' + pkDevice;
        return this.makeVeraRequest(url, path, sessionToken);
    }

    makeVeraRequest(url, path, sessionToken, keepAlive, mmsInfo, returnRawBody) {
        console.log("[VeraHub] -------------------------")
        console.log("[VeraHub] makeVeraRequest: " + url)
        console.log("[VeraHub] path           : " + path);
        console.log("[VeraHub] sessionToken   : " + sessionToken);
        console.log("[VeraHub] keepAlive      : " + keepAlive);
        console.log("[VeraHub] mmsInfo        : " + mmsInfo);
        console.log("[VeraHub] returnRawBody  : " + returnRawBody);

        var completeUrl = "https://" + url + path;

        var options = {
            url: completeUrl,
            method: 'GET'
        };

        if (sessionToken) {
            options.headers = { 'MMSSession': sessionToken };
        }
        else if (mmsInfo) {
            options.headers = {
                'MMSAuth': mmsInfo.Identity,
                'MMSAuthSig': mmsInfo.IdentitySignature
            };
        }

        if (keepAlive) {
            var keepAliveAgent = new https.Agent({keepAlive: true});
            options.agent = keepAliveAgent;
        }

        return request(options)
            .then(function (body) {
                if (returnRawBody) {
                    return body;
                }
                else {
                    return JSON.parse(body);
                }
            });
    }

    onboard(authInfo) {
        console.log("Onboarding Vera Hub");

        // global vera constants
        // this is a random set of text provided by vera to use during the SHA1 calculation
        this.veraHashBase = 'oZ7QE6LcLJp6fiWzdqZc';
        this.veraSessionTokenPath = '/info/session/token';
        this.veraAccountUrl = 'us-autha11.mios.com';

        // vera requires the username to be stored in all lowercase
        this.username = authInfo[0].username.toLowerCase();
        this.password = authInfo[0].password;
        this.pkDevice = authInfo[0].pkDevice;
        this.sha1Password = cryptojs_sha1.SHA1(this.username + this.password + this.veraHashBase) + "";

        // get initial set of authorization info, including account server
        return this.getMmsAuthInfo().then((mmsInfo) => {
            // get account server session token
            return this.getSessionToken(mmsInfo.Server_Account).then((accountSessionToken) => {
                // get info for the hub/device on the account, including relay server
                return this.getDeviceInfo(mmsInfo.Server_Account, accountSessionToken, this.pkDevice).then((deviceInfo) => {
                    // get relay server session token
                    return this.getSessionToken(deviceInfo.Server_Relay, mmsInfo).then((relaySessionToken) => {
                        var accessTokenInfo = {
                            relaySessionToken: relaySessionToken,
                            relayServer: deviceInfo.Server_Relay,
                            refreshToken: this.sha1Password,
                            username: this.username,
                            pkDevice: this.pkDevice,
                            // this is for local/proximal access
                            internalIP: deviceInfo.InternalIP,
                            port: deviceInfo.AccessiblePort
                        };
                        
                        return accessTokenInfo;
                    })
                })
            })
        });
    }
}

module.exports = Onboarding;