var Meridian = require(".");

var d = new Meridian("TN51");

d.on('volume', (vol) => {
    console.log("*** Got volume", vol);
});

d.on('source', (src) => {
    console.log("*** Got source", src);
});

let first = true;
d.on('connected', () => {
    console.log("*** Connected");
    if (first) {
	first = false;
	let stdin = process.openStdin();
	stdin.addListener("data", ev_cmd);
    }
});

d.on('disconnected', () => {
    console.log("*** Disconnected");
});


function ev_cmd(line) {
    line = line.toString().trim();

    let m;
    if      ((m=line.match(/volume up/i))) d.volume_up();
    else if ((m=line.match(/volume down/i))) d.volume_down();
    else if ((m=line.match(/volume ([0-9][0-9]*)/i))) d.set_volume(m[1]);
    else if ((m=line.match(/source (..)/i))) d.set_source(m[1].toUpperCase());
    else if ((m=line.match(/mute/i))) d.mute();
    else if ((m=line.match(/standby/i))) d.standby();
    else console.log("!!! Unknown command " + line);
}

d.start({ "port" : "/dev/tty.usbserial" });
