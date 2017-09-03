"use strict";

let SerialPort = require("serialport"),
    util       = require("util"),
    events     = require('events');

function Meridian(devicetype) {
    if (devicetype == "TN51") {
        // Meridian Technical Note TN51.2
    } else if (devicetype == "TN49") {
        // Meridian Technical Note TN49
    } else if (devicetype == "218") {
        // Meridian 218 Zone Controller
    } else if (devicetype == "DS 6ii03") {
        // Meridian DSP5000 and DSP420
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

function send(val, cb) {
    this._qw.push(val);
    _processw.call(this);
};

Meridian.prototype.volume_up = function() {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
        send.call(this, "VP\r");
    } else if (this.devicetype == "218") {
        send.call(this, "#MSR VP\r");
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_up");
    }
};
Meridian.prototype.volume_down = function(val) {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
        send.call(this, "VM\r");
    } else {
        throw new Error("device type " + this.devicetype + " do not support volume_down");
    }
};
Meridian.prototype.set_volume = function(val) {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
	if (this.properties.volume == val) return;
	if (this.volumetimer) clearTimeout(this.volumetimer);
        this.volumetimer = setTimeout(() => {
            send.call(this, "VN" + ("00" + Number(val).toString()).slice(-2) + "\r");
	}, 50)
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_volume");
    }
};
Meridian.prototype.standby = function(val) {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
        send.call(this, "SB\r");
    } else {
        throw new Error("device type " + this.devicetype + " do not support standby");
    }
};
Meridian.prototype.set_source = function(val) {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
        send.call(this, val.slice(0,2) + "\r");
    } else {
        throw new Error("device type " + this.devicetype + " do not support set_source");
    }
};
Meridian.prototype.mute = function() {
    if (this.devicetype == "TN51" ||
        this.devicetype == "TN49" ||
        this.devicetype == "DS 6ii03")
    {
        send.call(this, "MU\r");
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
	    if (this.initializing) {
		this.initializing = false;
		this.emit('connected');
            }

	    data = data.trim();
	    console.log('[Meridian] received:', data);

	    if (/^V\. *([0-9][0-9]*) *$/.test(data)) {
	       let val = Number(data.trim().replace(/^V\. *([0-9][0-9]*) *$/, "$1"));
	       if (this.properties.volume != val) {
		   this.properties.volume = val;
	           this.emit('volume', val);
	       }

	    } else if (/^Standby$/.test(data) || /^\.$/.test(data)) {
	        let val = "Standby";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else if (/^Mute/.test(data)) { // Mute or Muted
	        let val = "Muted";
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }

	    } else {
	        let val = data.trim();
	        if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }
	    }
        });

    } else if (this.devicetype == "TN49") {
        this._port = new SerialPort(opts.port, {
            baudRate: opts.baud || 9600,
            parser:   SerialPort.parsers.readline("\r")
        });

        this._port.on('data', data => {
	    if (this.initializing) {
		this.initializing = false;
		this.emit('connected');
            }

	    console.log('[Meridian] received:', data);

            if (data.length != 20) return;

            if (/Diag\./.test(data)) return;
            if (/^FIFO /.test(data)) return;
            if (/^DSP  /.test(data)) return;
            if (/^Error /.test(data)) return;
            if (/^ *$/.test(data)) return;

            if (/^ *\. *$/.test(data)) {
                let val = "Standby";
                if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); }
                return;
            }

            if (/^Mute *$/.test(data) || /^Muted *$/.test(data)) {
                let val = "Muted";
                if (this.properties.source != val) { this.properties.source = val; this.emit('source', val); } 
                return;
            }

            if (data[5] != ' ') return;

            let source = data.substring(0,5).trim();
            if (this.properties.source != source) { this.properties.source = source; this.emit('source', source); }

            if (/ [ 0-9][0-9]$/.test(data)) {
                let vol = Number(data.substring(18));
                if (!Number.isNaN(vol))
                    if (this.properties.volume != vol) { this.properties.volume = vol; this.emit('volume', vol); }
            }
        });

    } else if (this.devicetype == "DS 6ii03") {
        this._port = new SerialPort(opts.port, {
            baudRate: opts.baud || 9600,
            parser:   SerialPort.parsers.readline("\r")
        });

        this._port.on('data', data => {
	    if (this.initializing) {
		this.initializing = false;
		this.emit('connected');
            }

	    data = data.trim();
	    console.log('[Meridian] received:', data);

	    if (/^..... +([0-9][0-9]?) *$/.test(data)) {
	       let vol = Number(data.trim().replace(/^..... +([0-9][0-9]?) *$/, "$1"));
	       let src = data.trim().replace(/^(.....) +[0-9][0-9]? *$/, "$1").trim();
	       if (this.properties.volume != vol) { this.properties.volume = vol; this.emit('volume', vol); }
               if (this.properties.source != src) { this.properties.source = src; this.emit('source', src); }

	    } else if (/^Standby$/i.test(data) || /^\.$/.test(data)) {
	        let src = "Standby";
	        if (this.properties.source != src) { this.properties.source = src; this.emit('source', src); }

	    } else if (/^Mute/i.test(data)) { // Mute or Muted
	        let src = "Muted";
	        if (this.properties.source != src) { this.properties.source = src; this.emit('source', src); }

	    } else {
	        let src = data.trim();
	        if (this.properties.source != src) { this.properties.source = src; this.emit('source', src); }
	    }
        });

    } else if (this.devicetype == "218") {
//        this._port = new SerialPort(opts.port, {
//            baudRate: opts.baud || 9600,
//            parser:   SerialPort.parsers.readline("\r")
//        });

//        "#MSR SB\n"
//            "#MSR VP\n"

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

        if (this.devicetype == "TN51" || this.devicetype == "TN49") {
            send.call(this, this.properties.source + "\r");
            send.call(this, "VN" + ("00" + Number(this.properties.volume).toString()).slice(-2) + "\r");
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

