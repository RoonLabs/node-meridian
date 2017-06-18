"use strict";

let SerialPort = require("serialport"),
    util       = require("util"),
    events     = require('events');

function MeridianRS232(devicetype) {
    if (devicetype == "TN51") {
        // Meridian Technical Note TN51.2
    } else {
        throw new Error("unsupported device type " + devicetype + " -- Unfortunately, there are many protocols for Meridian RS232 control.");
    }
    this.devicetype = devicetype;
    this.seq = 0;
}

util.inherits(MeridianRS232, events.EventEmitter);

let _processw = function() {
    if (!this._port) return;
    if (this._woutstanding) return;
    if (this._qw.length == 0) return;

    this._woutstanding = true;
    console.log("Meridian RS232: Writing", this._qw[0]);

    this._port.write(this._qw[0],
                    (err) => {
                        if (err) return;
                        this._qw.shift();
                        this._woutstanding = false;
                        setTimeout(() => { _processw.call(this); }, 50);
                    });
}

let _tn51 = function(responselines, val, cb) {
    this._qw.push(val + "\r");
    _processw.call(this);
    this._qr.push({ responsesleft: responselines, cb: cb });
};

MeridianRS232.prototype.volume_up = function() {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, "VP", function(lines) {
            this.emit('volume', lines[0].replace(/Vn: *([0-9][0-9]*)/, "$1"));
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_up");
    }
};
MeridianRS232.prototype.volume_down = function(val) {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, "VM", function(lines) {
            this.emit('volume', lines[0].replace(/Vn: *([0-9][0-9]*)/, "$1"));
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_down");
    }
};
MeridianRS232.prototype.set_volume = function(val) {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, "VN" + ("00" + Number(val).toString()).slice(-2), function(lines) {
            this.emit('volume', lines[0].replace(/Vn: *([0-9][0-9]*)/, "$1"));
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_volume");
    }
};
MeridianRS232.prototype.standby = function(val) {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, true, "SB", function(lines) {
            this.emit('source', "SB");
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support standby");
    }
};
MeridianRS232.prototype.set_source = function(val) {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, true, val.slice(0,2), function(lines) {
            this.emit('source', val);
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_source");
    }
};
MeridianRS232.prototype.mute = function(val) {
    if (devicetype == "TN51") {
        _tn51.call(this, 1, true, "MU", function(lines) {
            this.emit('source', "MU");
        });
    } else {
        throw new Error("device type " + this.devicetype + " do not support mute");
    }
};

MeridianRS232.prototype.init = function(port, opts, cb) {
    let self = this;

    this._qw = [];
    this._qr = [];
    this._woutstanding = false;

    this.properties = {};

    if (this.devicetype == "TN51") {
        this._port = new SerialPort(port, {
            baudRate: 9600,
            parser:   SerialPort.parsers.readline("\r")
        });

        this._port.on('data', data => {
            if (this._qr.length > 0) {
                var r = this._qr[0];
                if (r.name == d.name) {
                    r.cb(false, d.val);
                    this._qr.shift();
                }
            }
        });
    } else {
        throw new Error("unsupported device type " + devicetype + " -- Someone forgot to write some code here.");
    }

    this._port.on('open', err => {
        _processw.call(this);
        this.emit('status', "initializing");
        opened();
    });

    this._port.on('close',      ()  => { this._port.close(() => { this._port = undefined; if (cb) { var cb2 = cb; cb = undefined; cb2('close');      } }) });
    this._port.on('error',      err => { this._port.close(() => { this._port = undefined; if (cb) { var cb2 = cb; cb = undefined; cb2('error');      } }) });
    this._port.on('disconnect', ()  => { this._port.close(() => { this._port = undefined; if (cb) { var cb2 = cb; cb = undefined; cb2('disconnect'); } }) });
};

MeridianRS232.prototype.start = function(port, opts) {
    this.seq++;

    let closecb = (why) => {
        this.emit('status', 'disconnected');
        if (why != 'close') {
            var seq = ++this.seq;
            setTimeout(() => {
                if (seq != this.seq) return;
                this.start(port, baud);
            }, 1000);
        }
    };

    if (this._port) {
        this._port.close(() => {
            this.init(port, opts, closecb);
        });
    } else {
        this.init(port, opts, closecb);
    }
};

MeridianRS232.prototype.stop = function() {
    this.seq++;
    if (this._port)
        this._port.close(() => {});
};

exports = module.exports = MeridianRS232;

