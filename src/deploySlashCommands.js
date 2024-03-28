const { plsParseArgs } = require('plsargs');
const args = plsParseArgs(process.argv.slice(2));
const chillout = require('chillout');
const { makeSureFolderExists } = require('stuffs');
const path = require('path');
const readdirRecursive = require('recursive-readdir');
const { TOKEN } = require('./config/settings');
const { ApplicationCommandOptionType, REST, Routes, ApplicationCommandManager } = require('discord.js');

(async () => {
	let command = [];

	let cleared = args.get(0) == 'guild' ? args.get(2) == 'clear' : (args.get(0) == 'global' ? args.get(1) == 'clear' : false);
	let deployed = args.get(0) == 'guild' ? 'guild' : args.get(0) == 'global' ? 'global' : null;

	if (!deployed) {
		console.error('Invalid sharing mode! Valid modes: guild, global');
		console.error('Usage: node deploySlashCommands.js guild <guildId> [clear]');
		console.error('Usage: node deploySlashCommands.js global [clear]');
		return process.exit(1);
	}

	if (!cleared) {
		let interactionsFolder = path.resolve(__dirname, 'commands');

		await makeSureFolderExists(interactionsFolder);

		let store = [];

		console.log('Reading interaction files...');

		let interactionFilePaths = await readdirRecursive(interactionsFolder);
		interactionFilePaths = interactionFilePaths.filter(interaction => {
			let state = path.basename(interaction).startsWith('-');
			return !state;
		});

		await chillout.forEach(interactionFilePaths, interactionFilePath => {
			const command = require(interactionFilePath);
			console.log(`Interaction "${command.type == 'CHAT_INPUT' ? `/${command.name.join(' ')}` : `${command.name[0]}`}" ${command.name[1] || ''} ${command.name[2] || ''} added to the transform list!`);
			store.push(command);
		});

		store = store.sort((a, b) => a.name.length - b.name.length);

		command = store.reduce((all, current) => {
			switch (current.name.length) {
				case 1: {
					all.push({
						type: current.type,
						name: current.name[0],
						description: current.description,
						defaultPermission: current.defaultPermission,
						options: current.options
					});
					break;
				}
				case 2: {
					let baseItem = all.find(i => {
						return i.name == current.name[0] && i.type == current.type;
					});

					if (!baseItem) {
						all.push({
							type: current.type,
							name: current.name[0],
							description: `${current.name[0]} commands`,
							defaultPermission: current.defaultPermission,
							options: [
								{
									type: ApplicationCommandOptionType.Subcommand,
									description: current.description,
									name: current.name[1],
									options: current.options
								}
							]
						});
					} else {
						baseItem.options.push({
							type: ApplicationCommandOptionType.Subcommand,
							description: current.description,
							name: current.name[1],
							options: current.options
						});
					}
					break;
				}
				case 33: {
					let subItem = all.find(i => {
						return i.name == current.name[0] && i.type == current.type;
					});

					if (!subItem) {
						all.push({
							type: current.type,
							name: current.name[0],
							description: `${current.name[0]} commands`,
							defaultPermission: current.defaultPermission,
							options: [
								{
									type: ApplicationCommandOptionType.SubcommandGroup,
									description: `${current.name[1]} commands`,
									name: current.name[1],
									options: [
										{
											type: ApplicationCommandOptionType.Subcommand,
											description: current.description,
											name: current.name[2],
											options: current.options
										}
									]
								}
							]
						});
					} else {
						let groupItem = subItem.options.find(i => {
							return i.name == current.name[1] && i.type == ApplicationCommandOptionType.SubcommandGroup;
						});

						if (!groupItem) {
							subItem.options.push({
								type: ApplicationCommandOptionType.SubcommandGroup,
								description: `${current.name[1]} commands`,
								name: current.name[1],
								options: [
									{
										type: ApplicationCommandOptionType.Subcommand,
										description: current.description,
										name: current.name[2],
										options: current.options
									}
								]
							});
						} else {
							groupItem.options.push({
								type: ApplicationCommandOptionType.Subcommand,
								description: current.description,
								name: current.name[2],
								options: current.options
							});
						}
					}
				}
					break;
			}

			return all;
		}, []);

		command = command.map(i => ApplicationCommandManager.transformCommand(i));
	} else {
		console.info('No interactions read, all existing ones will be cleared...');
	}

	const rest = new REST({ version: '9' }).setToken(TOKEN);
	const client = await rest.get(Routes.user());

	console.info(`Account information received! ${client.username}#${client.discriminator} (${client.id})`);

	console.info('Interactions are posted on discord!');
	switch (deployed) {
		case 'guild': {
			let guildId = args.get(1);
			console.info(`Deploy mode: guild (${guildId})`);

			await rest.put(Routes.applicationGuildCommands(client.id, guildId), { body: command });

			console.info('Shared commands may take 3-5 seconds to arrive.');
			break;
		}

		case 'global': {
			console.info('Deploy mode: global');

			await rest.put(Routes.applicationCommands(client.id), { body: command });

			console.info('Shared commands take up to 1 hour to arrive. If you want it to come immediately, you can throw your bot from your server and get it back.');
			break;
		}
	}

	console.info('Interactions Shared!');
})();