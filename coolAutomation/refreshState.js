const unified = require('./unified')

module.exports = (platform) => {
	return () => {
		if (!platform.processingState && !platform.setProcessing) {
			platform.processingState = true
			clearTimeout(platform.pollingTimeout)
			setTimeout(async () => {

				try {
					platform.devices = await platform.API.getDevices()
					await platform.storage.setItem('cool-automation-devices', platform.devices)
					
				} catch(err) {
					platform.log.easyDebug('<<<< ---- Refresh State FAILED! ---- >>>>')
					platform.log.easyDebug(err)
					platform.processingState = false
					if (platform.pollingInterval) {
						platform.log.easyDebug(`Will try again in ${platform.pollingInterval/1000} seconds...`)
						platform.pollingTimeout = setTimeout(platform.refreshState, platform.pollingInterval)
					}
					return
				}
				if (platform.setProcessing) {
					platform.processingState = false
					if (platform.pollingInterval)
						platform.pollingTimeout = setTimeout(platform.refreshState, platform.pollingInterval)
					return
				}
				
				platform.devices.forEach(device => {
					const airConditioner = platform.activeAccessories.find(accessory => accessory.type === 'AirConditioner' && accessory.id === device.uid)

					if (airConditioner) {
						// Update AC state in cache + HomeKit
						airConditioner.state.update(unified.acState(airConditioner, device))
					}
				})



				// register new devices / unregister removed devices
				platform.syncHomeKitCache()

				// start timeout for next polling
				if (platform.pollingInterval)
					platform.pollingTimeout = setTimeout(platform.refreshState, platform.pollingInterval)

				// block new requests for extra 5 seconds
				setTimeout(() => {
					platform.processingState = false
				}, 1000)

			}, platform.refreshDelay)
		}
	}
}