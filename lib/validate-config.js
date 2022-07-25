const Joi = require('@hapi/joi');
const schema = Joi.object({
	slackApiToken: Joi.alternatives(
		Joi.string().pattern(/^xoxp|^xoxb/).min(10).max(255),
		Joi.function(),
	).required(),

	repeatEvery: Joi.number(),

	errorHandler: Joi.function(),

	groups: Joi.array()
		.min(1)
		.items(Joi.object({
			integration: Joi.object({
				opsgenie: Joi.string().required(),
			}).min(1).max(1).required(),
			slackGroupName: Joi.string().min(1).required(),
			slackChannel: Joi.alternatives(
				Joi.string().min(1),
				Joi.array().min(1),
			),
			name: Joi.string(),
		})),

	integrations: Joi.object({
		opsgenie: Joi.object({
			credentials: Joi.alternatives(
				Joi.string().min(10).max(255),
				Joi.function(),
			).required(),
			username: Joi.string(),
			icon: Joi.string(),
			messageTemplate: Joi.alternatives(
				Joi.string(),
				Joi.function(),
			),
		}),
	}).min(1).required(),
});

module.exports = config => {
	const validation = schema.validate(config);

	return validation.error;
};
