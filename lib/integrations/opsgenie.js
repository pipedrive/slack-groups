const debug = require('debug')('opsgenie');
const axios = require('axios');
const { arraysEqual } = require('../utils');

const NO_ONE_USER_ID = 'U03Q5M5FK7H';
const NO_ONE_USER_INFO = {
	slackName: 'no-one',
	realName: 'no-one',
	phone: '',
};

class OpsGenie {
	constructor({ cache, config, group, slack }) {
		this.config = config;
		this.cache = cache;
		this.group = group;
		this.slack = slack;
	}

	async get(path) {
		const request = await axios.get(`https://api.opsgenie.com/v2/${path}`, {
			headers: {
				Authorization: `GenieKey ${this.config.credentials}`,
			},
		});

		return request.data;
	}

	async getAllGroups() {
		if (this.cache.opsgenieGroups) {
			return this.cache.opsgenieGroups;
		}

		const res = await this.get('schedules/on-calls');
		const groups = res.data.filter(g => g._parent.enabled).map(g => ({
			id: g._parent.id,
			name: g._parent.name,
			participants: g.onCallParticipants.filter(p => p.type === 'user').map(p => p.name),
		}));

		this.cache.opsgenieGroups = groups;

		return groups;
	}

	async getSchedule(groupId) {
		this.cache.opsgenieSchedules = this.cache.opsgenieSchedules || {};

		if (this.cache.opsgenieSchedules[groupId]) {
			return this.cache.opsgenieSchedules[groupId];
		}

		const res = await this.get(`schedules/${groupId}`);
		const rotation = res.data.rotations.pop();
		const schedule = {
			name: rotation.name,
			type: rotation.type,
			participants: rotation.participants.filter(r => r.type === 'user').map(r => r.username),
		};

		this.cache.opsgenieSchedules[groupId] = schedule;

		return schedule;
	}

	async notifyGroupChanged({ groupId, users, scheduleInterval }) {
		const fields = [];

		users.forEach(user => {
			fields.push({
				title: 'Slack Name',
				value: user.slackName || 'no-one',
				short: true,
			});
			fields.push({
				title: 'Real Name' || 'no-one',
				value: user.realName,
				short: true,
			});
			fields.push({
				title: 'Phone',
				value: user.phone,
				short: true,
			});
			fields.push({
				title: 'Schedule interval',
				value: scheduleInterval,
				short: true,
			});
		});

		const channels = Array.isArray(this.group.slackChannel) ? this.group.slackChannel : [this.group.slackChannel];

		for (const channel of channels) {
			await this.slack.postMessage({
				channel,
				username: this.config.username,
				icon_emoji: this.config.icon,
				attachments: [{
					fields,
					text: this.config.messageTemplate({
						groupId,
						opsgenieName: this.group.integration.opsgenie,
					}),
					color: 'good',
				}],
			});
		}
	}

	async run() {
		const opsgenieGroups = await this.getAllGroups();
		// eslint-disable-next-line max-len
		const slackGroup = this.cache.slackGroups.find(sg => sg.name.toLowerCase() === this.group.slackGroupName.toLowerCase());

		if (!slackGroup) {
			debug(`Could not find Slack group associated with ${this.group.slackGroupName}`);

			return;
		}

		const opsgenieGroup = opsgenieGroups.find(og =>
			og.name.toLowerCase() === this.group.integration.opsgenie.toLowerCase() ||
			og.name.toLowerCase() === `${this.group.integration.opsgenie.toLowerCase()}_schedule`,
		);

		if (!opsgenieGroup) {
			debug(`Could not find Opsgenie group associated with ${this.group.integration.opsgenie}`);

			return;
		}
		let slackUsers = [];
		if (opsgenieGroup.participants && opsgenieGroup.participants.length > 0) {
			slackUsers = (
				await Promise.all(opsgenieGroup.participants.map(email => this.slack.getUserByEmail(email))))
				.filter(i => i);
			const slackUserIds = slackUsers.map(snu => snu.id);

			if (slackUserIds.length === 0 || arraysEqual(slackGroup.userIds, slackUserIds)) {
				debug(`No changes to ${slackGroup.name}`);

				return;
			}

			debug(`Updating ${slackGroup.name}`);

			await this.slack.updateGroupUsers(slackGroup.id, slackUserIds);
		} else {
			if (slackGroup.userIds.includes(NO_ONE_USER_ID)) {
				return;
			}
			await this.slack.updateGroupUsers(slackGroup.id, [NO_ONE_USER_ID]);
			slackUsers.push(NO_ONE_USER_INFO);
		}

		if (this.group.slackChannel) {
			const opsgenieGroupDetails = await this.getSchedule(opsgenieGroup.id);

			await this.notifyGroupChanged({
				groupId: slackGroup.id,
				users: slackUsers,
				scheduleInterval: opsgenieGroupDetails.type,
			});
		}
	}
}

module.exports = (opts) => (new OpsGenie(opts)).run();
