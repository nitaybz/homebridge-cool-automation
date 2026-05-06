const unified = require('./unified')

module.exports = (device, hubConfig) => {

	const setTimeoutDelay = 600
	let setTimer = null
	let preventTurningOff = false
	let pendingChanges = new Set()
	const API = device.coolAutomationAPI

	const log = device.log
	// const state = device.state

	return {
		get: (target, prop) => {
			// check for last update and refresh state if needed
			if (!hubConfig.setProcessing)
				device.refreshState()

			// return a function to update state (multiple properties)
			if (prop === 'update')
				return (state) => {
					if (!hubConfig.setProcessing) {
						Object.keys(state).forEach(key => { target[key] = state[key] })
						device.updateHomeKit()
					}
				}


			return target[prop]
		},

		set: (state, prop, value) => {

			state[prop] = value
			pendingChanges.add(prop)

			// Send Reset Filter command and update value
			// if (prop === 'filterChange') {
			// 	try {
			// 		ElectraApi.resetFilterIndicator(device.id)
			// 	} catch(err) {
			// 		log('Error occurred! -> Could not reset filter indicator')
			// 	}
			// 	return
			// } else if (prop === 'filterLifeLevel')
			// 	return


			hubConfig.setProcessing = true

			// Make sure device is not turning off when setting fanSpeed to 0 (AUTO)
			if (
				prop === 'fanSpeed'
				&& value === 0
				&& device.capabilities[state.mode]
				&& device.capabilities[state.mode].autoFanSpeed
			)
				preventTurningOff = true


			clearTimeout(setTimer)
			setTimer = setTimeout(async function () {
				// Make sure device is not turning off when setting fanSpeed to 0 (AUTO)
				if (preventTurningOff && state.active === false) {
					state.active = true
					preventTurningOff = false
				}

				if (device.blockTurningOn) {
					state.active = false
					device.blockTurningOn = false
				}

				// Snapshot the fields that the user actually changed in this
				// debounce window, so unified.formattedState can avoid sending
				// commands for fields that were not touched (e.g. clobbering
				// fanSpeed back to AUTO when the user only changed temperature
				// via Siri, see #21).
				const changedProps = new Set(pendingChanges)
				pendingChanges = new Set()

				const newState = unified.formattedState(device, state, changedProps)
				log(device.name, ' -> Setting New State:')
				log(JSON.stringify(newState, null, 2))

				try {
					// send state command to Electra
					await API.setState(device.id, newState)
				} catch (err) {
					log(`ERROR setting ${prop} to ${value}`)
					log(err)
					setTimeout(() => {
						hubConfig.setProcessing = false
						device.refreshState()
					}, 1000)
					return
				}
				setTimeout(() => {
					device.updateHomeKit()
					setTimeout(() => {
						hubConfig.setProcessing = false
						device.refreshState()
					}, 5000)
				}, 500)

			}, setTimeoutDelay)

			return true;
		}
	}
}