var MeridianRS232 = require(".");

var d = new MeridianRS232("TN51");

d.on('volume', (vol) => {
    console.log("volume", vol);
});

d.on('source', (src) => {
    console.log("source", src);
});

d.start("/dev/cu.usbserial", {});
