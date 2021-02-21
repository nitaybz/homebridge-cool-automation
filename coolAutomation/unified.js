function fanSpeedToHK(value, fanSpeeds) {
	if (value === 'AUTO')
		return 0

	fanSpeeds = fanSpeeds.filter(speed => speed !== 'AUTO')
	const totalSpeeds = fanSpeeds.length
	const valueIndex = fanSpeeds.indexOf(value) + 1
	return Math.round(100 * valueIndex / totalSpeeds)
}

function HKToFanSpeed(value, fanSpeeds) {

	let selected = 'AUTO'
	if (!fanSpeeds.includes('AUTO'))
		selected = fanSpeeds[0]

	if (value !== 0) {
		fanSpeeds = fanSpeeds.filter(speed => speed !== 'AUTO')
		const totalSpeeds = fanSpeeds.length
		for (let i = 0; i < fanSpeeds.length; i++) {
			if (value <= (100 * (i + 1) / totalSpeeds))	{
				selected = fanSpeeds[i]
				break
			}
		}
	}
	return selected
}

function toFahrenheit(value) {
	return Math.round((value * 1.8) + 32)
}


function toCelsius(value) {
	return (value - 32) / 1.8
}

module.exports = {

	deviceInformation: device => {
		return {
			id: device.uid,
			model: 'homebridge-cool-automation',
			serial: device.uid,
			manufacturer: 'Cool Automation',
			roomName: device.uid,
			temperatureUnit: device.tunit,
			filterService: false
		}
	},

	capabilities: (platform, device) => {
		const capabilities = {}

		const speeds = []
		if (platform.vlowFspeed !== false)
			speeds.push('VLOW')
		if (platform.lowFspeed !== false)
			speeds.push('LOW')
		if (platform.medFspeed !== false)
			speeds.push('MED')
		if (platform.highFspeed !== false)
			speeds.push('HIGH')
		if (platform.topFspeed !== false)
			speeds.push('TOP')
		if (platform.autoFspeed !== false)
			speeds.push('AUTO')

		const settings = {
			temperatures: {
				C: {
					min: device.tunit === 'F' && platform.minTemp !== 30 ? toCelsius(platform.minTemp) : platform.minTemp,
					max: device.tunit === 'F' && platform.maxTemp !== 30 ? toCelsius(platform.maxTemp) : platform.maxTemp
				}
			},
			fanSpeeds: speeds,
			autoFanSpeed: speeds.includes('AUTO'),
			swing: false
		}

		capabilities.ALL = settings

		if (platform.coolMode !== false)
			capabilities.COOL = settings

		if (platform.heatMode !== false)
			capabilities.HEAT = settings

		if (platform.autoMode !== false)
			capabilities.AUTO = settings

		if (platform.fanMode !== false)
			capabilities.FAN = settings

		if (platform.dryMode !== false)
			capabilities.DRY = settings

		return capabilities
	},

	acState: (device, state) => {
		return {
			active: state.onoff === 'ON',
			mode: state.mode,
			targetTemperature: state.tunit === 'C' ? state.st : toCelsius(state.st),
			currentTemperature: state.tunit === 'C' ? state.rt : toCelsius(state.rt),
			fanSpeed: state.fspeed ? fanSpeedToHK(state.fspeed, device.capabilities.ALL.fanSpeeds) : 0
		}
	},

	formattedState: (device, state) => {
		return {
			onoff: state.active ? 'ON' : 'OFF',
			mode: state.mode,
			st: device.usesFahrenheit ? toFahrenheit(state.targetTemperature) : state.targetTemperature,
			fspeed: state.fanSpeed ? HKToFanSpeed(state.fanSpeed, device.capabilities.ALL.fanSpeeds): 'AUTO'
		}
	}
}