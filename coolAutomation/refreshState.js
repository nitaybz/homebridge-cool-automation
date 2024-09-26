const unified = require('./unified')

module.exports = (platform) => {
	return () => {
		platform.hubs.forEach((hubConfig, hubIndex) => {
			if (!hubConfig.processingState && !hubConfig.setProcessing) {
				hubConfig.processingState = true
				clearTimeout(hubConfig.pollingTimeout)
				setTimeout(async () => {

					try {
						hubConfig.devices = await hubConfig.API.getDevices()
						await hubConfig.storage.setItem('cool-automation-devices', hubConfig.devices)
					} catch (err) {
						platform.log.easyDebug(`<<<< ---- Refresh State FAILED for Cool Master Device Hub ${hubIndex + 1} ---- >>>>`)
						platform.log.easyDebug(err)
						hubConfig.processingState = false
						if (platform.statePollingInterval) {
							platform.log.easyDebug(`Cool Master Device Hub ${hubIndex + 1}: Will try again in ${platform.statePollingInterval} seconds...`)
							hubConfig.pollingTimeout = setTimeout(platform.refreshState, platform.statePollingInterval * 1000)
						}
						return
					}

					if (hubConfig.setProcessing) {
						hubConfig.processingState = false
						if (platform.statePollingInterval)
							hubConfig.pollingTimeout = setTimeout(platform.refreshState, platform.statePollingInterval * 1000)
						return
					}

					hubConfig.devices.forEach(device => {
						const airConditioner = hubConfig.activeAccessories.find(accessory => accessory.type === 'AirConditioner' && accessory.id === device.uid)

						if (airConditioner) {
							// Update AC state in cache + HomeKit
							airConditioner.state.update(unified.acState(airConditioner, device))
						}
					})

					// Register new devices / unregister removed devices
					platform.syncHomeKitCache()

					// Start timeout for next polling
					if (platform.statePollingInterval)
						hubConfig.pollingTimeout = setTimeout(platform.refreshState, platform.statePollingInterval * 1000)

					// Block new requests for extra 1 second
					setTimeout(() => {
						hubConfig.processingState = false
					}, 1000)

				}, hubConfig.refreshDelay || 2000)
			}
		})
	}
}