var q = require('q');
var dgram = require('dgram');

/**
 * Discovers and onboard Flux WiFi bulbs
 */
class Onboarding {
    constructor() {
        this._discoveryTimeout = 10000;

        // Magic for discovering a Flux WiFi bulb, reverse engineered with WireShark.
        this._discoveryPort = 48899;
        this._discoveryMessage = 'HF-A11ASSISTHREAD';
    }

    onboard(deviceInfo) {
        // Flux WiFi bulbs require no authentication.
    }

    /**
     * Discovers any devices on the current network using a number of different methods.  Each time a device is found
     * that is understood by opent2t, it will be onboarded and the discoveryCallback will be called with the device info
     * 
     */
    discover(discoveryCallback, timeout) {
        var deferred = q.defer();

        var server = dgram.createSocket('udp4');
        var broadcastAddress =  '255.255.255.255';

        server.on('error', (err) => {
            throw new Error("Broadcast error: ", + err);
        });

        server.on('message', (msg, rinfo) => {
            var msgString = msg.toString();

            if (msgString.startsWith(rinfo.address)) {
                var parts = msg.toString().split(',');
                if (parts.length > 2) {
                    var deviceInfo = {
                        raw: msg.toString(),
                        deviceType: "Flux WiFi Bulb",
                        controlId: parts[1],
                        address: parts[0],
                        friendlyName: "Flux WiFi Bulb"
                    }

                    if (discoveryCallback && typeof discoveryCallback === 'function') {
                        discoveryCallback(deviceInfo);
                    }
                }
            }
        });

        server.on('listening', () => {
            server.setBroadcast(true);
            var messageBuffer = Buffer.from(this._discoveryMessage);
            server.send(messageBuffer, 0, messageBuffer.length, this._discoveryPort, broadcastAddress);
        });

        server.bind(this._discoveryPort);

        setTimeout(() => {
            server.close();
            deferred.resolve();
        }, timeout);

        return deferred.promise;
    }

    
}

module.exports = Onboarding;
