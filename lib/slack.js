const { WebClient } = require('@slack/web-api');

class Slack {
	constructor(apiToken) {
		this.slack = new WebClient(apiToken);
	}

	enableGroup(groupId) {
		return this.slack.usergroups.enable({
			usergroup: groupId,
		});
	}

	disableGroup(groupId) {
		return this.slack.usergroups.disable({
			usergroup: groupId,
		});
	}

	async getUserByEmail(email) {
		const user = await this.slack.users.lookupByEmail({
			email,
		});

		if (!user || !user.ok) {
			return;
		}

		return {
			id: user.user.id,
			slackName: user.user.name,
			realName: user.user.real_name,
			phone: user.user.profile.phone,
		};
	}

	async getAllGroups() {
		const groups = await this.slack.usergroups.list({
			include_users: true,
		});

		if (!groups || !groups.ok) {
			return [];
		}

		return groups.usergroups.map(g => ({
			id: g.id,
			name: g.handle,
			userIds: g.users,
		}));
	}

	updateGroupUsers(groupId, userIds) {
		return this.slack.usergroups.users.update({
			usergroup: groupId,
			users: userIds.join(','),
		});
	}

	postMessage(opts) {
		return this.slack.chat.postMessage(opts);
	}
}

module.exports = Slack;
