<img src="branding/coolautomation_homebridge.png" width="500px">



# homebridge-cool-automation

[![Downloads](https://img.shields.io/npm/dt/homebridge-cool-automation.svg?color=critical)](https://www.npmjs.com/package/homebridge-cool-automation)
[![Version](https://img.shields.io/npm/v/homebridge-cool-automation)](https://www.npmjs.com/package/homebridge-cool-automation)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)


[Homebridge](https://github.com/nfarina/homebridge) plugin for Cool Automation - HVAC Systems Controller

<img src="branding/product.png" width="300px">

### Requirements

<img src="https://img.shields.io/badge/node-%3E%3D10.17-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D1.1.6-brightgreen">

check with: `node -v` & `homebridge -V` and update if needed

# Installation

<!-- This plugin is Homebridge verified and HOOBS certified and can be easily installed and configured through their UI. -->

The plugin can be easily installed configured via Homebridge UI.

Otherwise, follow these instructions

1. Install homebridge using: `sudo npm install -g homebridge --unsafe-perm`
2. Install this plugin using: `sudo npm install -g homebridge-cool-automation`
3. Update your configuration file. See `config-sample.json` in this repository for a sample.

\* install from git: `sudo npm install -g git+https://github.com/nitaybz/homebridge-cool-automation.git`


## Config file

#### Easy config (required):

``` json
"platforms": [
    {
        "platform": "CoolAutomation",
        "hubs": [
            {
                "ip": "192.168.1.100",
                "port": 10102
            }
        ],
    }
]
```

#### Advanced config (optional):

``` json
"platforms": [
    {
        "platform": "CoolAutomation",
        "hubs": [
            {
                "ip": "192.168.1.100",
                "port": 10102
            },
            {
                "ip": "192.168.1.101",
                "port": 10102
            }
        ],
        "statePollingInterval": 30,
        "minTemperature": 16,
        "maxTemperature": 30,
        "coolMode": true,
        "heatMode": true,
        "autoMode": false,
        "fanMode": true,
        "dryMode": true,
        "vlowFspeed": false,
        "lowFspeed": true,
        "medFspeed": true,
        "highFspeed": true,
        "topFspeed": false,
        "autoFspeed": true,
        "debug": false
    }
]

```


*Only `ip` and `port` are device-specific settings. All other settings are platform-wide.*

## Configuration Parameters

### Platform-wide Settings

| Parameter               | Description                                                | Required | Default | Type    |
|-------------------------|------------------------------------------------------------|----------|---------|---------|
| `statePollingInterval`  | Time in seconds between each status polling of the devices  | No       | 30      | Integer |
| `minTemperature`        | Minimum Temperature to show in HomeKit Control             | No       | 16      | Integer |
| `maxTemperature`        | Maximum Temperature to show in HomeKit Control             | No       | 30      | Integer |
| `coolMode`              | Enable COOL mode control                                   | No       | true    | Boolean |
| `heatMode`              | Enable HEAT mode control                                   | No       | true    | Boolean |
| `autoMode`              | Enable AUTO mode control                                   | No       | false   | Boolean |
| `fanMode`               | Enable FAN mode control - Adds extra fan accessory          | No       | true    | Boolean |
| `dryMode`               | Enable DRY mode control - Adds extra dehumidifier accessory | No       | true    | Boolean |
| `vlowFspeed`            | VLOW Fan Speed                                             | No       | false   | Boolean |
| `lowFspeed`             | LOW Fan Speed                                              | No       | true    | Boolean |
| `medFspeed`             | MED Fan Speed                                              | No       | true    | Boolean |
| `highFspeed`            | HIGH Fan Speed                                             | No       | true    | Boolean |
| `topFspeed`             | TOP Fan Speed                                              | No       | false   | Boolean |
| `autoFspeed`            | AUTO Fan Speed                                             | No       | true    | Boolean |
| `debug`                 | Enable Debug Logging                                      | No       | false   | Boolean |

### Hub-specific Settings

| Parameter | Description        | Required | Default | Type    |
|-----------|--------------------|----------|---------|---------|
| `ip`      | IP Address of the Cool Master Device | Yes      | -       | String  |
| `port`    | Port number for communication        | No       | 10102   | Integer |

> **Important**: Only `ip` and `port` are hub-specific settings. All other configurations are platform-wide and apply to all hubs.


### Fan speeds & "AUTO" speed
Since HomeKit control over fan speed is with a slider between 0-100, the plugin converts the steps you have in the Electra app to values between 1 to 100, when 100 is highest and 1 is lowest. Setting the fan speed to 0, should actually set it to "AUTO" speed.

*Available fan speeds: AUTO, VLOW, LOW, MED, HIGH, TOP*<br>
*enable or disable them inside the config*


### Issues & Debug

If you experience any issues with the plugin please refer to the [Issues](https://github.com/nitaybz/homebridge-cool-automation/issues) tab and check if your issue is already described there, if it doesn't, please create a new issue with as much detailed information as you can give (logs are crucial).<br>

if you want to even speed up the process, you can add `"debug": true` to your config, which will give me more details on the logs and speed up fixing the issue.

-------------------------------------------

## Support homebridge-cool-automation

**homebridge-cool-automation** is a free plugin under the GNU license. it was developed as a contribution to the homebridge/hoobs community with lots of love and thoughts.
Creating and maintaining Homebridge plugins consume a lot of time and effort and if you would like to share your appreciation, feel free to "Star" or donate. 

<a target="blank" href="https://www.paypal.me/nitaybz"><img src="https://img.shields.io/badge/PayPal-Donate-blue.svg?logo=paypal"/></a><br>
<a target="blank" href="https://www.patreon.com/nitaybz"><img src="https://img.shields.io/badge/PATREON-Become a patron-red.svg?logo=patreon"/></a><br>
<a target="blank" href="https://ko-fi.com/nitaybz"><img src="https://img.shields.io/badge/Ko--Fi-Buy%20me%20a%20coffee-29abe0.svg?logo=ko-fi"/></a>