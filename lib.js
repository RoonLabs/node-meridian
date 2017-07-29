"use strict";

let SerialPort = require("serialport"),
    util       = require("util"),
    events     = require('events');

function Meridian(devicetype) {
    if (devicetype == "TN51") {
        // Meridian Technical Note TN51.2
    } else if (devicetype == "218") {
        // Meridian 218 Zone Controller
    } else {
        throw new Error("unsupported device type " + devicetype + " -- Unfortunately, there are many protocols for Meridian control.");
    }
    this.devicetype = devicetype;
    this.seq = 0;
}

util.inherits(Meridian, events.EventEmitter);

let _processw = function() {
    if (!this._port) return;
    if (this._woutstanding) return;
    if (this._qw.length == 0) return;

    this._woutstanding = true;
    console.log("[Meridian] writing:", this._qw[0]);

    this._port.write(this._qw[0] + "\r",
                    (err) => {
                        if (err) return;
                        this._qw.shift();
                        this._woutstanding = false;
                        setTimeout(() => { _processw.call(this); }, 150);
                    });
}

let _tn51 = function(val, cb) {
    this._qw.push(val + "\r");
    _processw.call(this);
};

Meridian.prototype.volume_up = function() {
    if (this.devicetype == "TN51") {
        _tn51.call(this, "VP");
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_up"); }
};
Meridian.prototype.volume_down = function(val) {
    if (this.devicetype == "TN51") {
        _tn51.call(this, "VM");
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_down");
    }
};
Meridian.prototype.set_volume = function(val) {
    if (this.devicetype == "TN51") {
	if (this.properties.volume == val) return;
	if (this.volumetimer) clearTimeout(this.volumetimer);
        this.volumetimer = setTimeout(() => {
		_tn51.call(this, "VN" + ("00" + Number(val).toString()).slice(-2));
	}, 50)
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_volume");
    }
};
Meridian.prototype.standby = function(val) {
    if (this.devicetype == "TN51") {
        _tn51.call(this, "SB");
    } else {
        throw new Error("device type " + this.devicetype + " do not support standby");
    }
};
Meridian.prototype.set_source = function(val) {
    if (this.devicetype == "TN51") {
        _tn51.call(this, val.slice(0,2));
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_source");
    }
};
Meridian.prototype.mute = function() {
    if (this.devicetype == "TN51") {
        _tn51.call(this, "MU");
    } else {
        throw new Error("device type " + this.devicetype + " do not support mute"); }
};

Meridian.prototype.init = function(opts, closecb) {
    let self = this;

    this._qw = [];
    this._woutstanding = false;

    this.properties = { volume: opts.volume || 1, source: opts.source || 'SB' };

    this.initializing = true;

    if (this.devicetype == "TN51") {
        this._port = new SerialPort(opts.port, {
            baudRate: opts.baud || 9600,
            parser:   SerialPort.parsers.readline("\r")
        });

        this._port.on('data', data => {
	    data = data.trim();
	    console.log('[Meridian] received:', data);

	    if (/^V\. *([0-9][0-9]*) *$/.test(data)) {
	       let val = Number(data.trim().replace(/^V\. *([0-9][0-9]*) *$/, "$1"));
	       if (this.properties.volume != val) {
		   this.properties.volume = val;
	           this.emit('volume', val);
	       }

	    } else if (/^Standby$/.test(data)) {
	        let val = "SB";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Muted$/.test(data)) {
	        let val = "MU";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^CD$/.test(data)) {
	        let val = "CD";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Aux$/.test(data)) {
	        let val = "AX";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^SLS$/.test(data)) {
	        let val = "MS";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^CD$/.test(data)) {
	        let val = "CD";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Radio$/.test(data)) {
	        let val = "RD";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^TV$/.test(data)) {
	        let val = "TV";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Tape$/.test(data)) {
	        let val = "TA";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Disc$/.test(data)) {
	        let val = "DC";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Cable$/.test(data)) {
	        let val = "CB";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Sat$/.test(data)) {
	        let val = "SA";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^iPod$/.test(data)) {
	        let val = "IP";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Game$/.test(data)) {
	        let val = "GA";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^V1$/.test(data)) {
	        let val = "V1";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^V2$/.test(data)) {
	        let val = "V2";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^USB$/.test(data)) {
	        let val = "US";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Mixer$/.test(data)) {
	        let val = "MX";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else {
	        console.log("[Meridian] Unknown data received:", data);
	    }

	    if (this.initializing) {
		this.initializing = false;
		this.emit('connected');
            }
        });
    } else {
        throw new Error("unsupported device type " + devicetype + " -- Someone forgot to write some code here.");
    }

    let timer = setTimeout(() => {
	if (this.initializing) {
            this.initializing = false;
	    this.emit('connected');
	}
    }, 3000);
    this._port.on('open', err => {
        this.emit('preconnected');

        if (this.devicetype == "TN51") {
            _tn51.call(this, this.properties.source);
            _tn51.call(this, "VN" + ("00" + Number(this.properties.volume).toString()).slice(-2));
        }
    });

    this._port.on('close',      ()  => { this._port.close(() => { this._port = undefined; if (closecb) { var cb2 = closecb; closecb = undefined; cb2('close');      } }) });
    this._port.on('error',      err => { this._port.close(() => { this._port = undefined; if (closecb) { var cb2 = closecb; closecb = undefined; cb2('error');      } }) });
    this._port.on('disconnect', ()  => { this._port.close(() => { this._port = undefined; if (closecb) { var cb2 = closecb; closecb = undefined; cb2('disconnect'); } }) });
};

Meridian.prototype.start = function(opts) {
    this.seq++;

    let closecb = (why) => {
        this.emit('disconnected');
        if (why != 'close') {
            var seq = ++this.seq;
            setTimeout(() => {
                if (seq != this.seq) return;
                this.start(opts);
            }, 1000);
        }
    };

    if (this._port) {
        this._port.close(() => {
            this.init(opts, closecb);
        });
    } else {
        this.init(opts, closecb);
    }
};

Meridian.prototype.stop = function() {
    this.seq++;
    if (this._port)
        this._port.close(() => {});
};

exports = module.exports = Meridian;

