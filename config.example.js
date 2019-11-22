module.exports = {
	// slackApiToken: can be an async function or a string
	slackApiToken: 'YOUR_SLACK_API_TOKEN',
	// repeatEvery: in milliseconds
	repeatEvery: 60000,
	groups: [
		{
			integration: {
				opsgenie: 'My Team Schedule',
			},
			slackGroupName: 'my-team-oncall',
			// can be an array as well
			slackChannel: 'my-team-channel',
		},
	],
	integrations: {
		opsgenie: {
			// credentials: can be an async function or a string
			credentials: 'YOUR_OPSGENIE_API_TOKEN',
			// rest are only used if the group has a slackChannel
			// messageTemplate: required
			messageTemplate: ({ opsgenieName, groupId }) =>
				`New person on-duty for ${opsgenieName} team in <!subteam^${groupId}> group`,
			// username: optional
			username: 'Onduty',
			// icon: optional
			icon: ':smile:',
		},
	},
};
