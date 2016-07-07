'use strict'; 

var https = require('https');
var cryptojs_sha1 = require('crypto-js');
var q = require('q');

function handleError(errorCallback, error)
{
    console.log("[VeraHub] Error!");
    if (error.statusMessage)
    {
        console.log(error.statusCode);
        console.log(error.statusMessage);
        console.log(error.headers);
    }
    else
    {
        console.log(error);
    }

    if (errorCallback)
    {
        errorCallback('Error', error);
        return;
    }
}

var internal = 
{
    // global vera constants
    // this is a random set of text provided by vera to use during the SHA1 calculation
    veraHashBase : 'oZ7QE6LcLJp6fiWzdqZc',
    veraSessionTokenPath : '/info/session/token',
    veraAccountUrl : 'us-autha11.mios.com',

    mmsInfo: undefined,
    pkDevice: undefined,
    username: undefined,
    sha1Password: undefined,

    getSessionToken : function (url)
    {
        return this.makeVeraRequest(url, this.veraSessionTokenPath, false, false, this.mmsInfo, true);
    },

    getMmsAuthInfo : function ()
    {
        var path = '/autha/auth/username/' + this.username + '?SHA1Password=' + this.sha1Password + '&PK_Oem=1';
        
        var deferred = q.defer();
        var myRef = this;
        var promise = this.makeVeraRequest(this.veraAccountUrl, path, false, false, false);
        promise.then(function (data)
            {
                myRef.mmsInfo = data;
                deferred.resolve(data);
            },
            function (error) {
                console.log(error);
                deferred.reject(error);
            }
        );

         return deferred.promise;
    },

    getDeviceInfo : function (url, sessionToken, pkDevice)
    {
        var path = '/device/device/device/' + pkDevice;
        return this.makeVeraRequest(url, path, sessionToken, false, false);
    },

    getUserData : function (url, sessionToken, pkDevice)
    {
        // vera defined fixed port number
        var path = '/relay/relay/relay/device/' + pkDevice + '/port_3480/data_request?id=user_data&output_format=json';
        return this.makeVeraRequest(url, path, sessionToken, true, false);
    },

    makeVeraRequest : function (url, path, sessionToken, keepAlive, mmsInfo, returnRawBody)
    {
        console.log("[VeraHub] -------------------------")
        console.log("[VeraHub] makeVeraRequest: " + url)
        console.log("[VeraHub] path           : " + path);
        console.log("[VeraHub] sessionToken   : " + sessionToken);
        console.log("[VeraHub] keepAlive      : " + keepAlive);
        console.log("[VeraHub] mmsInfo        : " + mmsInfo);

        var deferred = q.defer();

        var getOptions = {
            protocol: 'https:',
            host: url,
            path: path,
            method: 'GET'
        };

        if (sessionToken)
        {
            getOptions.headers = { 'MMSSession': sessionToken };
        }
        else if (mmsInfo)
        {
            getOptions.headers = {
                'MMSAuth': mmsInfo.Identity,
                'MMSAuthSig': mmsInfo.IdentitySignature
            };
        }

        if (keepAlive)
        {
            var keepAliveAgent = new https.Agent({keepAlive: true});
            getOptions.agent = keepAliveAgent;
        }

        var request = https.get(getOptions, function(response)  {
            var body = '';
            response.setEncoding('utf8');
            response.on('data', function(data) {
                body += data;
            });

            response.on('end', function() {
                if (response.statusCode != 200) {
                    deferred.reject(response);
                } else {
                    if (returnRawBody)
                    {
                        deferred.resolve(body);
                    }
                    else
                    {
                        var parsedBody = JSON.parse(body);
                        deferred.resolve(parsedBody);
                    }
                }
            });

            response.on('error', function(e) {
                deferred.reject(e);
            });
        });

        request.on('error', (e) => {
            deferred.reject(e);
        });

        return deferred.promise;
    },
};

module.exports = 
{
    inputNeeded : [
        {
            type: 'input',
            name: 'pkDevice',
            message: 'Vera Device Serial Number (8 digit numeric): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid Serial Number.';
                }
            }
        },
        {
            type: 'input',
            name: 'username',
            message: 'Vera User Name (create this in the Vera app): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid User Name.';
                }
            }
        },
        {
            type: 'password',
            name: 'password',
            message: 'Vera Password (create this in the Vera app): ',
            validate: function(value) {
                var pass = !!value;
                if (pass) {
                    return true;
                } else {
                    return 'Please enter a valid Password.';
                }
            }
        }
    ],

    // complete info as returned by the server
    hubInfo: undefined,

    // devices list as returned by the server 
    devices: undefined,

    // this is the server url to use when talking to the hub 
    relayServer: undefined,

    // the session token for the relay server
    relaySessionToken: undefined,

    // the is the serial number of the vera hub device
    // it is referred to as pkDevice in the vera forums
    pkDevice: undefined,

    // authorizes to the server based on the properties saved in the object 
    authorize: function(errorCallback) {
        var deferred = q.defer();

        var myRef = this;

        // get initial set of authorization info, including account server
        internal.getMmsAuthInfo().then(function(mmsInfo) {

            // get account server session token
            internal.getSessionToken(mmsInfo.Server_Account).then(function(accountSessionToken) {

                // get info for the hub/device on the account, including relay server
                internal.getDeviceInfo(mmsInfo.Server_Account, accountSessionToken, internal.pkDevice).then(function (deviceInfo) {

                    // get relay server session token
                    internal.getSessionToken(deviceInfo.Server_Relay, mmsInfo).then(function (relaySessionToken) {

                        // get hubs info, vera calls this user_data
                        internal.getUserData(deviceInfo.Server_Relay, relaySessionToken, internal.pkDevice).then(function(hubInfo) {
                            myRef.relaySessionToken = relaySessionToken;
                            myRef.relayServer = deviceInfo.Server_Relay;
                            myRef.pkDevice = internal.pkDevice;
                            myRef.hubInfo = hubInfo;
                            myRef.devices = hubInfo.devices;
                            deferred.resolve();
                        },
                        function (error) { 
                            handleError(errorCallback, error); 
                            deferred.reject(error); 
                        })        
                    },
                    function (error) { 
                        handleError(errorCallback, error);
                        deferred.reject(error); 
                    })
                },
                function (error) { 
                    handleError(errorCallback, error);
                    deferred.reject(error); 
                })
            },
            function (error) { 
                handleError(errorCallback, error);
                deferred.reject(error); 
            })
        },
        function (error) { 
            handleError(errorCallback, error);
            deferred.reject(error); 
        });

        return deferred.promise;
    },

    // connects to the hub based on the answers provided
    connect : function(answers, errorCallback)
    {
        var deferred = q.defer();

        if (!answers.pkDevice && !answers.username && ! answers.password)
        {
            handleError(errorCallback, "Invalid input");
            setTimeout(function () { deferred.reject("Invalid input"); }, 1000);
        }
        else
        {   
            // vera requires the username to be stored in all lowercase
            internal.username = answers.username.toLowerCase();
            internal.password = answers.password;
            internal.pkDevice = answers.pkDevice;
            
            // vera requires the combination of the username, password and the hash to be SHA1 encoded
            // store the string value of the SHA1 value rather than the SHA1 object
            internal.sha1Password = cryptojs_sha1.SHA1(internal.username + internal.password + internal.veraHashBase) + "";
            this.sha1Password = internal.sha1Password;

            this.authorize().then(function (data) { 
                deferred.resolve(data);
            }, 
            function (error) {
                handleError(errorCallback, error);
                deferred.reject(error); 
            });
        }

        return deferred.promise;
    },

    printDevices: function (devices)
    {
        devices.forEach(function(device) {
            console.log(device.name + " (" + device.id + ") - " + device.device_type);
        });
    }
};