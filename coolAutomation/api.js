const net = require('net');
const { Queue } = require('async-await-queue');

const myPriority = -1;

module.exports = function (hubConfig, platformLog) {
	// Per-hub state. Previously these were module-level globals, which meant
	// the second hub's factory call would overwrite the first hub's client /
	// port / ip / log, leaving the first hub silently pointing at the second
	// hub's connection. Closes #19.
	const log = platformLog;
	const port = hubConfig.port || 10102;
	const ip = hubConfig.ip;
	const myq = new Queue(1, 500);
	let client = new net.Socket();
	let connected = false;

	const sendCommand = async function (cmd) {
		const me = Symbol();
		/* We wait in the line here */
		await myq.wait(me, myPriority);

		try {
			return await new Promise((resolve, reject) => {
				log.easyDebug(`Sending Command (${ip}): ${cmd}`);

				let commandTimeout = null

				let dataBuffer = Buffer.from('', 'utf-8')

				const cleanup = () => {
					client.removeListener('data', onData);
					client.removeListener('error', onError);
					clearTimeout(commandTimeout)
				}

				const onData = data => {

					dataBuffer = Buffer.concat([dataBuffer, Buffer.from(data, 'utf-8')]);

					clearTimeout(commandTimeout)
					commandTimeout = setTimeout(() => {
						cleanup();

						let response = dataBuffer.toString();
						response = response.replace(/[>\r]/g, '').trim();

						if (response.slice(-2) !== 'OK') {
							log.error(`Error Sending Command (${ip}): ${cmd}`);
							reject(response);
							return;
						}

						response = response.replace(/OK$/g, '').trim().split('\n');
						response = response.filter(item => item !== 'OK');
						log.easyDebug(`Successful response (${ip}, ${cmd}):`);
						log.easyDebug(response);
						resolve(response);
					}, 500)
				};

				const onError = err => {
					log.error(`Error Sending Command (${ip}): ${cmd}`);
					cleanup();
					reject(err.message || err);
				};

				client.on('data', onData);
				client.on('error', onError);

				if (!connected || (!client.connecting && !client.writable)) {
					client.connect(port, ip);
					client.once('connect', () => {
						connected = true
						client.write(`${cmd}\r\n`);
					})
				} else {
					client.write(`${cmd}\r\n`);
				}
			});
		} finally {
			// Release the queue slot ONLY after the response (or error) has landed.
			// Releasing synchronously after client.write would let the next command
			// start while the previous response was still being read on the same
			// TCP socket, stacking listeners and clobbering each other (closes #16,
			// contributes to #18).
			myq.end(me);
		}
	};

	return {
		getDevices: () => {
			return sendCommand('ls2')
				.then(response => parseState(response))
				.catch(err => {
					throw err;
				});
		},

		setState: (uid, state) => {
			let chain = sendCommand(`${state.onoff.toLowerCase()} ${uid}`)
				.then(() => sendCommand(`${state.mode.toLowerCase()} ${uid}`))
				.then(() => sendCommand(`temp ${uid} ${state.st}`));
			// Only send fspeed when the formattedState explicitly included it,
			// otherwise we would clobber a fan speed the user did not touch
			// (closes #21).
			if (typeof state.fspeed === 'string' && state.fspeed.length > 0) {
				chain = chain.then(() => sendCommand(`fspeed ${uid} ${state.fspeed[0].toLowerCase()}`));
			}
			return chain;
		},

		closeConnection: () => {
			client.end();
			connected = false;
		},
	};
};

const parseState = data => {
	return data.map(d => {
		// verify temp unit
		let celsius = true;
		if (d.substring(11, 17).includes('F')) celsius = false;

		return {
			uid: d.substring(0, 6).trim(),
			onoff: d.substring(7, 10).trim(),
			st: parseFloat(celsius ? d.substring(11, 15).trim() : d.substring(11, 16).trim()),
			rt: parseFloat(celsius ? d.substring(17, 21).trim() : d.substring(18, 23).trim()),
			fspeed: celsius ? d.substring(23, 27).trim().toUpperCase() : d.substring(25, 29).trim().toUpperCase(),
			mode: celsius ? d.substring(28, 32).trim().toUpperCase() : d.substring(30, 34).trim().toUpperCase(),
			flr: celsius ? d.substring(33, 36).trim() : d.substring(35, 38).trim(),
			filt: celsius ? d[38] : d[38],
			dmnd: celsius ? d[40] : d[40],
			tunit: celsius ? 'C' : 'F'
		};
	});
};
