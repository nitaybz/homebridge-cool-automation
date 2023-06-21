const net = require('net');

let log, client, port, ip;

module.exports = async function (platform) {
	log = platform.log;
	port = platform.port || 10102
	ip = platform.ip

	client = new net.Socket();

	return {
		getDevices: () => {
			return sendCommand('ls2')
				.then(response => parseState(response))
				.catch(err => {
					throw err;
				});
		},

		setState: (uid, state) => {
			return sendCommand(`${state.onoff.toLowerCase()} ${uid}`)
				.then(() => sendCommand(`${state.mode.toLowerCase()} ${uid}`))
				.then(() => sendCommand(`temp ${uid} ${state.st}`))
				.then(() => sendCommand(`fspeed ${uid} ${state.fspeed[0].toLowerCase()}`));
		},

		closeConnection: () => {
			client.end(); // Close the connection when it's no longer needed
		},
	};
};

const sendCommand = function (cmd) {
	return new Promise((resolve, reject) => {
		log.easyDebug(`Sending Command: ${cmd}`);

		if (!client.connecting && !client.writable) {
			client.connect(port, ip);
		}

		const onData = data => {
			let response = data.toString();
			response = response.replace(/[>\r]/g, '').trim();

			if (response.slice(-2) !== 'OK') {
				log.error(`Error Sending Command: ${cmd}`);
				reject(response);
				return;
			}

			response = response.replace(/OK$/g, '').trim().split('\n');
			log.easyDebug(`Successful response (${cmd}):`);
			log.easyDebug(response);
			resolve(response);
		};

		const onError = err => {
			log.error(`Error Sending Command: ${cmd}`);
			reject(err.message || err);
		};

		client.on('data', onData);
		client.on('error', onError);

		client.write(`${cmd}\n`, () => {
			client.removeListener('data', onData);
			client.removeListener('error', onError);
		});
	});
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