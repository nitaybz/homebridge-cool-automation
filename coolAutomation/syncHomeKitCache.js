const AirConditioner = require('../homekit/AirConditioner')

module.exports = (platform) => {
	return () => {
		platform.hubs.forEach((hubConfig, hubIndex) => {
			hubConfig.devices.forEach(device => {
				// Check if AirConditioner is already active
				const airConditionerIsNew = !hubConfig.activeAccessories?.find(accessory => accessory.type === 'AirConditioner' && accessory.id === device.uid)
				if (airConditionerIsNew && device.uid !== 'OK') {
					const airConditioner = new AirConditioner(device, hubConfig, platform)
					hubConfig.activeAccessories.push(airConditioner)
				}
			})

			// Find accessories to remove
			const accessoriesToRemove = []
			hubConfig.cachedAccessories.forEach(accessory => {
				if (accessory.displayName === 'OK AC' || accessory.name === 'OK AC' || accessory.displayName === 'OK') {
					accessoriesToRemove.push(accessory)
				}
			})

			// Remove the accessories
			accessoriesToRemove.forEach(accessory => {
				platform.log.easyDebug(`Removing accessory: ${accessory.displayName} from Cool Master Device Hub ${hubConfig.hubNumber}`)
				platform.api.unregisterPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [accessory])
				const index = hubConfig.cachedAccessories.indexOf(accessory)
				if (index > -1) {
					hubConfig.cachedAccessories.splice(index, 1)
				}
			})
		})
	}
}