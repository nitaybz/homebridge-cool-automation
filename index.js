const API = require('./coolAutomation/api')
const syncHomeKitCache = require('./coolAutomation/syncHomeKitCache')
const refreshState = require('./coolAutomation/refreshState')
const path = require('path')
const storage = require('node-persist')
const PLUGIN_NAME = 'homebridge-cool-automation'
const PLATFORM_NAME = 'CoolAutomation'

module.exports = (api) => {
	api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, CoolAutomationPlatform)
}

class CoolAutomationPlatform {
	constructor(log, config, api) {

		this.cachedAccessories = []
		this.activeAccessories = []
		this.log = log
		this.api = api
		this.storage = storage
		this.refreshState = refreshState(this)
		this.syncHomeKitCache = syncHomeKitCache(this)
		this.name = config['name'] || PLATFORM_NAME
		this.disableFan = config['disableFan'] || false
		this.disableDry = config['disableDry'] || false
		this.swingDirection = config['swingDirection'] || 'both'
		this.minTemp = config['minTemperature'] || 16
		this.maxTemp = config['maxTemperature'] || 30
		this.coolMode = config['coolMode']
		this.heatMode = config['heatMode']
		this.autoMode = config['autoMode'] 
		this.fanMode = config['fanMode']
		this.dryMode = config['dryMode']
		this.vlowFspeed = config['vlowFspeed'] 
		this.lowFspeed = config['lowFspeed']
		this.medFspeed = config['medFspeed']
		this.highFspeed = config['highFspeed']
		this.topFspeed = config['topFspeed'] 
		this.autoFspeed = config['autoFspeed']


		this.debug = config['debug'] || false
		this.PLUGIN_NAME = PLUGIN_NAME
		this.PLATFORM_NAME = PLATFORM_NAME

		// ~~~~~~~~~~~~~~~~~~~~~ Cool Automation Specials ~~~~~~~~~~~~~~~~~~~~~ //
		
		this.ip = config['ip']
		this.port = config['port']
		
		if (!this.ip) {
			this.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  --  ERROR  --  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n')
			this.log('Can\'t start homebridge-cool-automation plugin without the device IP Address !!\n')
			this.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n')
			return
		}


		this.persistPath = path.join(this.api.user.persistPath(), '/../cool-automation-persist')
		this.emptyState = {devices:{}}
		this.CELSIUS_UNIT = 'C'
		this.FAHRENHEIT_UNIT = 'F'
		let requestedInterval = config['statePollingInterval'] === 0 ? 0 : (config['statePollingInterval'] || 30) // default polling time is 30 seconds
		if (requestedInterval < 5) 
			requestedInterval = 5
		this.refreshDelay = 2000
		this.locations = []

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

		this.setProcessing = false
		this.pollingTimeout = null
		this.processingState = false
		this.pollingInterval = requestedInterval ? (requestedInterval * 1000 - this.refreshDelay) : false

		// define debug method to output debug logs when enabled in the config
		this.log.easyDebug = (...content) => {
			if (this.debug) {
				this.log(content.reduce((previous, current) => {
					return previous + ' ' + current
				}))
			} else
				this.log.debug(content.reduce((previous, current) => {
					return previous + ' ' + current
				}))
		}
		
		this.api.on('didFinishLaunching', async () => {

			await this.storage.init({
				dir: this.persistPath,
				forgiveParseErrors: true
			})


			this.cachedState = await this.storage.getItem('cool-automation-state') || this.emptyState
			if (!this.cachedState.devices)
				this.cachedState = this.emptyState
				
			this.API = await API(this)


			this.api.on('shutdown', () => {
				this.API.closeConnection()
			});

			try {
				this.devices = await this.API.getDevices()
				await this.storage.setItem('cool-automation-devices', this.devices)
			} catch(err) {
				this.log('ERR:', err)
				this.devices = await this.storage.getItem('cool-automation-devices') || []
			}
			
			this.syncHomeKitCache()

			if (this.pollingInterval)
				this.pollingTimeout = setTimeout(this.refreshState, this.pollingInterval)
			
		})

	}

	configureAccessory(accessory) {
		this.cachedAccessories.push(accessory)
	}

}
