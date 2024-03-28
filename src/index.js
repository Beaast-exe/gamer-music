const { GamerClient } = require('./GamerClient');
const client = new GamerClient();

client.connect();

module.exports = { client };