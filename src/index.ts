import { Client, GatewayIntentBits, Events } from 'discord.js';
import { registerCommands } from './command-manager';
import dotenv from 'dotenv';

import config from './config.json';

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c: Client) => {
    const guilds = (await c.guilds.fetch()).values();

	console.log(`Ready! Logged in as ${c.user?.tag}`);

    // Register the commands for each guild the bot is in

    for (const guild of guilds) {
        registerCommands(c, guild);
    }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);