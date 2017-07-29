# Control for Meridian Audio Devices

Initialization:

```javascript
var Meridian = require("node-meridian");
var d = new Meridian("TN51");
```

Listening to events:

```javascript
d.on('volume', function(volume) { });
d.on('source', function(source) { });
```

`volume` will be a number 1-99

`source` can be one of the following:

* SB - Standby
* MU - Mute
* CD - CD
* RD - Radio
* LP, AX,or MS - Aux/SLS
* TV - TV
* TA, T1, or IP - iPod
* T2, or SA - SAT
* CR or DC - Disc
* CB - Cable
* TX or DV - DVD
* V1 or US - USB
* V2 or MX - Mixer
* LD or GA - Game

Note that Meridian treats Mute and Standby as a "source".

Starting/Stopping the connection to the Meridian device:

```javascript
d.start(port, opts);
```

* `port` should be like `'/dev/cu.usbserial'` or something similar on MacOS or Linux, or `'COM3'` on Windows
* `opts` should be {}



```javascript
d.stop();
```
