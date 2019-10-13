describe('validate-config', () => {
	let validateConfig;
	let config;

	beforeEach(() => {
		validateConfig = require('./validate-config');
		config = {
			slackApiToken: 'xoxp-8472965726',
			repeatEvery: 5,
			errorHandler: () => {},
			groups: [
				{
					integration: {
						opsgenie: 'OpsTeam',
					},
					slackGroupName: 'slack-groups',
					slackChannel: 'slack-channel',
				},
			],
			integrations: {
				opsgenie: {
					credentials: 'h74ih-jf983j',
				},
			},
		};
	});

	it('fails validating empty object', () => {
		expect(validateConfig({})).toBeTruthy();
	});

	it('passes with string tokens', () => {
		expect(validateConfig(config)).toBeFalsy();
	});

	it('passes with function tokens', () => {
		expect(validateConfig({
			...config,
			slackApiToken: () => {},
			integrations: {
				opsgenie: {
					credentials: () => {},
				},
			},
		})).toBeFalsy();
	});
});
