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
d.start(opts);
```

and

```javascript
d.stop();
```


For serial based devices, `opts` should be something like:
```json
{
  "port": "/dev/cu.usbserial"
}
```

On Windows, you should use a port like "COM3".


For IP based devices like the [218](https://www.meridian-audio.com/en/products/streaming/218/), `opts` should be like this:
```json
{
    "ip": "192.168.1.7"
}
```


--------------
Meridian's protocol is slightly different on each device, so you have to pass in the name of the protocol. These are what each of the protocols map to:

**TN51**
- DSP520
- DSP640
- M6
- DSW
- DSP3200
- DSP3300
- DSP5200
- DSP7200
- DSP8000

**TN49**
- 808
- 818

**DS 6ii03**
- DSP 5000
- DSP 420
- DSP 33
