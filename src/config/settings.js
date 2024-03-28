const config = require('./index');

module.exports = {
	TOKEN: config.token || 'YOUR_TOKEN',
	OWNER_ID: config.ownerID || 'YOUR_CLIENT_ID',
	EMBED_COLOR: config.embedColor || '#ff0000',

	// Default autocomplete search
	SEARCH_DEFAULT: ['lo fi', 'jvke', 'post malone', 'bassboost'],

	// Leave voice empty
	LEAVE_EMPTY: parseInt(config.music.leaveWhenEmpty || '120000'), // 1000 = 1 second

	// Spotify support playlist more than 100+ tracks || Default = false || Can get from here: https://developer.spotify.com/dashboard/applications
	SPOTIFY_TRACKS: parseBoolean(config.spotify.tracks || false),
	SPOTIFY_ID: config.spotify.spotify_id || 'SPOTIFY_CLIENT_ID',
	SPOTIFY_SECRET: config.spotify.spotify_secret || 'SPOTIFY_CLIENT_SECRET'
};

function parseBoolean(bool) {
	if (typeof (ask) === 'string') {
		bool = bool.trim().toLowerCase();
	}

	switch (bool) {
		case true:
		case 'true':
			return true;
		default:
			return false;
	}
}