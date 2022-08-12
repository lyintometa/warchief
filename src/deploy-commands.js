import fs from 'fs'
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9"
import { clientId, token } from './configuration/configuration.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const global = false;
const commands = []
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commands')).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    console.log(path.resolve(__dirname, './commands', file))
    const command = await import(`./commands/${file}`).then(_ => _.default)
	commands.push(command.data.toJSON());
}

const rest = new REST({version: '9'}).setToken(token)

if (global){
    rest.put(Routes.applicationCommands(clientId), { body: []})
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
} else {
    const clientId = '969902874643533864'
    const guildIds = ['969890487035109386', '996133495590096948']
    const res = await Promise.all(guildIds.map(guildId => rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
    )))
    console.log('Successfully registered guild commands.')
}