const API = require('./coolAutomation/api')
const SyncHomeKitCache = require('./coolAutomation/syncHomeKitCache')
const RefreshState = require('./coolAutomation/refreshState')
const path = require('path')
const storage = require('node-persist')
const PLUGIN_NAME = 'homebridge-cool-automation'
const PLATFORM_NAME = 'CoolAutomation'

module.exports = (api) => {
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, CoolAutomationPlatform)
}

class CoolAutomationPlatform {
    constructor(log, config, api) {
				this.PLUGIN_NAME = PLUGIN_NAME
				this.PLATFORM_NAME = PLATFORM_NAME
        this.log = log
        this.api = api
        this.storage = storage
        this.refreshState = RefreshState(this)
        this.syncHomeKitCache = SyncHomeKitCache(this)
        this.debug = config['debug'] || false

        // Initialize storage path
        this.persistPath = path.join(this.api.user.persistPath(), '/../cool-automation-persist')

        // Platform-wide settings
        this.statePollingInterval = config['statePollingInterval'] || 30
        if (this.statePollingInterval < 5) 
            this.statePollingInterval = 5
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

        // Define debug method
        this.log.easyDebug = (...content) => {
            if (this.debug) {
                this.log(content.join(' '))
            } else {
                this.log.debug(content.join(' '))
            }
        }

        // Initialize multiple hubs
        this.hubs = []
        if (Array.isArray(config.hubs) && config.hubs.length > 0) {
            // Multiple Hubs Configuration
            config.hubs.forEach((hubConfig, index) => {
                this.initializeHub(hubConfig, index + 1)
            })
        } else if (config.ip) {
            // Single Hub Configuration (Backward Compatibility)
            this.initializeHub({ ip: config.ip, port: config.port }, 1)
        } else {
            this.log.error('No valid configuration found for CoolAutomation platform.')
        }
    }

    initializeHub(hubConfig, hubNumber) {
        this.log(`Initializing Cool Master Device Hub ${hubNumber} with IP: ${hubConfig.ip}`)

        // Assign hub number for identification
        hubConfig.hubNumber = hubNumber

        // Initialize storage for the hub
        const hubPersistPath = path.join(this.persistPath, `hub_${hubNumber}`)
        hubConfig.persistPath = hubPersistPath
        hubConfig.emptyState = { devices: {} }

        // Initialize storage
        hubConfig.storage = storage.create({
            dir: hubPersistPath,
            forgiveParseErrors: true
        })

        // Initialize cached state
        hubConfig.storage.init().then(async () => {
            hubConfig.cachedState = await hubConfig.storage.getItem('cool-automation-state') || hubConfig.emptyState
            if (!hubConfig.cachedState.devices)
                hubConfig.cachedState = hubConfig.emptyState

            // Initialize CoolAutomation API
            hubConfig.API = API(hubConfig, this.log)

            // Handle shutdown for each hub
            this.api.on('shutdown', () => {
                if (hubConfig.API && hubConfig.API.closeConnection) {
                    hubConfig.API.closeConnection()
                }
            })

            // Fetch devices
            try {
                hubConfig.devices = await hubConfig.API.getDevices()
                await hubConfig.storage.setItem('cool-automation-devices', hubConfig.devices)
            } catch (err) {
                this.log.error(`Cool Master Device Hub ${hubNumber}: Error fetching devices - ${err}`)
                hubConfig.devices = await hubConfig.storage.getItem('cool-automation-devices') || []
            }

            // Initialize active and cached accessories
            hubConfig.cachedAccessories = []
            hubConfig.activeAccessories = []

            // Sync HomeKit cache
            this.syncHomeKitCache()

            // Start polling if enabled
            if (this.statePollingInterval) {
                hubConfig.pollingTimeout = setTimeout(this.refreshState, this.statePollingInterval * 1000)
            }

        }).catch(err => {
            this.log.error(`Cool Master Device Hub ${hubNumber}: Error initializing storage - ${err}`)
        })

        // Add hub to hubs array
        this.hubs.push(hubConfig)
    }

    configureAccessory(accessory) {
        // Assign accessory to all hubs (if applicable)
        this.hubs.forEach(hub => {
            hub.cachedAccessories.push(accessory)
        })
    }
}
