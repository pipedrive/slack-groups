const debug = require('debug')('runner');
const Slack = require('./slack');
const validateConfig = require('./validate-config');

function requireValidConfig(config) {
	const configErrors = validateConfig(config);

	if (configErrors) {
		throw Error(configErrors);
	}

	debug('config is valid');
}

function runIfFunction(v) {
	if (typeof v === 'function') {
		return v();
	}

	return v;
}

async function getIntegrationConfigs(integrations) {
	const seeded = {};

	for (const key of Object.keys(integrations)) {
		seeded[key] = {
			...integrations[key],
			credentials: await runIfFunction(integrations[key].credentials),
		};
	}

	return seeded;
}

// generator allows breaking out of the function any time
async function* run(config) {
	const cache = {};
	const slackToken = yield runIfFunction(config.slackApiToken);
	const slack = new Slack(slackToken);
	const integrationConfigs = yield getIntegrationConfigs(config.integrations);

	cache.slackGroups = yield slack.getAllGroups();

	for (const group of config.groups) {
		const integrationName = Object.keys(group.integration)[0];
		const integration = require(`./integrations/${integrationName}`);

		yield integration({
			cache,
			group,
			config: integrationConfigs[integrationName],
			slack,
		});
	}
}

class Runner {
	constructor(config) {
		requireValidConfig(config);

		this.config = config;
		this.cancel = false;
	}

	async start() {
		try {
			debug('Starting sync');

			const iterator = run(this.config);

			let val;
			let done = false;

			while (!this.cancel && !done) {
				const next = await iterator.next(val);

				done = next.done;
				val = next.value;
			}
		} catch (e) {
			debug(e);

			if (typeof this.config.errorHandler === 'function') {
				this.config.errorHandler(e);
			}
		}

		if (!this.cancel && this.config.repeatEvery) {
			debug(`Restarting sync in ${this.config.repeatEvery}ms`);
			setTimeout(this.start.bind(this), this.config.repeatEvery);
		}
	}

	cancel() {
		this.cancel = true;
	}
}

module.exports = Runner;
