'use strict'; 

var https = require('https');
var cryptojs_sha1 = require('crypto-js');
var q = require('q');

var internal = 
{
    // global vera constants
    veraHashBase : 'oZ7QE6LcLJp6fiWzdqZc',
    veraSessionTokenPath : '/info/session/token',
    veraAccountUrl : 'us-autha11.mios.com',

    mmsInfo: undefined,
    pkDevice: undefined,
    username: undefined,
    password: undefined,

    getSessionToken : function (url)
    {
        return this.makeVeraRequest(url, this.veraSessionTokenPath, false, false, this.mmsInfo, true);
    },

    getMmsAuthInfo : function (answers)
    {
        var sha1Password = cryptojs_sha1.SHA1(this.username + this.password + this.veraHashBase);
        var path = '/autha/auth/username/' + this.username + '?SHA1Password=' + sha1Password + '&PK_Oem=1';
        
        var deferred = q.defer();
        var myRef = this;
        var promise = this.makeVeraRequest(this.veraAccountUrl, path, false, false, false);
        promise.then(function (data)
            {
                myRef.mmsInfo = data;
                deferred.resolve(data);
            },
            function (error) {
                console.log("error");
                console.log(error);
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
            type: 'input',
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

    hubInfo: undefined,
    devices: undefined,
    sessionToken: undefined,
    relayServer: undefined,
    pkDevice: undefined,

    connect : function(answers, errorCallback)
    {
        internal.pkDevice = answers.pkDevice;
        internal.username = answers.username;
        internal.password = answers.password;

        var deferred = q.defer();
        var myRef = this;
                var mmsInfoPromise = internal.getMmsAuthInfo();
                mmsInfoPromise.then( 
                    function(mmsInfo)
                    {
                        var firstSessionPromise = internal.getSessionToken(internal.mmsInfo.Server_Account);
                        firstSessionPromise.then(
                            function(sessionToken)
                            {
                                var deviceInfoPromise = internal.getDeviceInfo(mmsInfo.Server_Account, sessionToken, answers.pkDevice);
                                deviceInfoPromise.then(
                                    function (deviceInfo)
                                    {
                                        var relaySessionPromise = internal.getSessionToken(deviceInfo.Server_Relay, mmsInfo);
                                        relaySessionPromise.then(
                                            function (relaySessionToken)
                                            {
                                                var devicesPromise = internal.getUserData(deviceInfo.Server_Relay, relaySessionToken, answers.pkDevice);
                                                devicesPromise.then(
                                                    function(hubInfo)
                                                    {
                                                        myRef.sessionToken = relaySessionToken;
                                                        myRef.relayServer = deviceInfo.Server_Relay;
                                                        myRef.pkDevice = answers.pkDevice;
                                                        myRef.hubInfo = hubInfo;
                                                        myRef.devices = hubInfo.devices;
                                                        deferred.resolve();
                                                    },
                                                    function (error){ handleError(errorCallback, error);}        
                                                )
                                            },
                                            function (error){ handleError(errorCallback, error);}        
                                        )
                                    },
                                    function (error){ handleError(errorCallback, error);}
                                )
                            },
                            function (error){ handleError(errorCallback, error);}
                        )
                    },
                    function (error){ handleError(errorCallback, error);}
                );

        return deferred.promise;
    },

    printDevices: function (devices)
    {
        for (var i = 0; i < devices.length; i++)
        {
            var device = devices[i];
            console.log(device.name + " (" + device.id + ") - " + device.device_type);
        }
    }


};