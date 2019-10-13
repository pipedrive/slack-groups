require('dotenv').config();
const debug = require('debug')('slack-groups');

const Runner = require('./lib/runner');

if (require.main === module) {
	const fs = require('fs');
	const configFile = './config.js';

	if (!fs.existsSync(configFile)) {
		debug('Config file does not exist');
		process.exit(1);
	}

	const config = require(configFile);
	const runner = new Runner(config);

	runner.start(config);
} else {
	module.exports = config => new Runner(config);
}
