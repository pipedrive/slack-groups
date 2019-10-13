# slack-groups
`slack-groups` is meant to update Slack group members based on 3rd party data. This can be used as either a library or a standalone service.
While this repository is meant as a way to integrate multiple external services with Slack groups, the only integration at the moment is with
OpsGenie.

Some Slack apps do not support updating Slack groups. For example, it is not possible to update a Slack group when an OpsGenie schedule changes.
This scenerio is exactly where `slack-groups` comes in as you can define a map of OpsGenie groups to Slack groups.

## Standalone Service
### Install dependencies
`npm i`

### Create config.js file
To use as a standalone service, you first should copy the file `config.example.js` to `config.js` and modify the values to fit your needs.

### Environment file (optional)
The service also supports using a `.env` file, which you must create manually. To enable debugging you can add the value `DEBUG=*` to the `.env` file.

## Library
Install the dependency with `npm i @pipedrive/slack-groups`

```javascript
const slackGroups = require('@pipedrive/slack-groups');
const runner = slackGroups({
	// See `config.example.js` for an example config to pass in
	...
});

runner.start();

// do stuff

runner.cancel();// cancel anytime. call `runner.start()` to restart
```
