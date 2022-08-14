import fs from 'fs'
import path from 'path';
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { Client, Collection } from 'discord.js'
import dataAccessService from './dataAccessDiscord/dataAccessDiscordService.js';

dotenv.config()
const client = new Client({intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"]})

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commands')).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`).then(_ => _.default)
	client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    await dataAccessService.init(client)
})

client.on('guildCreate', async guild => {
    await dataAccessService.guildCreate(guild)
})

client.on('guildDelete', async guild => {
    dataAccessService.guildDelete(guild)
})

client.on("messageDelete", function(message) {
    const settings = dataAccessService.getDataAccessSettings(message.guildId)
    if (!settings) return;
    settings.deleteTable(message.channelId)
});

client.on("messageReactionAdd", async function(messageReaction, user) {

    if (messageReaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await messageReaction.message.fetch();
            await messageReaction.message.reactions.fetch()
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
    }
    
	// Now the message has been cached and is fully available
	console.log(`${messageReaction.message.author.username}'s message "${messageReaction.message.content}" gained a reaction!`);
    console.log(messageReaction.message.reactions.cache.map(reaction => reaction.users.cache.map(_ => _.id)))
    const userReactions = messageReaction.message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id))
    try {
        for (const reaction of userReactions.values()) {
            //console.log(reaction)
            await reaction.users.remove(user.id)
        }
    } catch (error) {
        console.error(`Failed to remove reaction ${reaction}${reaction.id}`);
    }


    // const emoji = messageReaction.message.guild.emojis.cache.get('969898672143880242')
    // await messageReaction.message.react(emoji)
    // console.log(messageReaction)
    // console.log(user)
});

client.on('messageCreate', async message => {
    try {
        console.log(message.content.codePointAt(0).toString(16))
        
    } catch (error) {
        
    }
})

client.on('interactionCreate', async interaction => {
    let command = client.commands.get(interaction.commandName); // error source?
	command = command ?? client.commands.get(interaction.message.interaction.commandName);
    if (!command) return;

    try {
		if (interaction.isCommand()) await command.execute(interaction);
		if (interaction.isSelectMenu()) await command.executeSelect(interaction);
		if (interaction.isButton()) await command.executeButton(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this interaction!', ephemeral: true });
	}
});

client.login(process.env.DJS_TOKEN)