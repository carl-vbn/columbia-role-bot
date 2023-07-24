import { Client, GatewayIntentBits, Events } from 'discord.js';
import { handleInteraction, registerCommands } from './command-manager';
import dotenv from 'dotenv';
import Save, { SaveData } from './save';
import { listenForRoleMenuButtonPress } from './interaction-listeners';

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export const saves: {[guildId: string]: any} = {};

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c: Client) => {
    const guilds = (await c.guilds.fetch()).values();

	console.log(`Ready! Logged in as ${c.user?.tag}`);

    // Register the commands for each guild the bot is in

    for (const oauth2Guild of guilds) {
        const guild = await oauth2Guild.fetch();

        const save = Save(guild.id);
        await save.loadData();
        saves[guild.id] = save;

        for (const roleMenuMessage of save.getRoleMenuMessages()) {
            const channel = await guild.channels.fetch(roleMenuMessage.channelId);
            if (channel != null && channel.isTextBased()) {
                const message = await channel.messages.fetch(roleMenuMessage.id);
                if (message != null) {
                    console.log(`Listening for role menu button presses on message '${message.id}' in guild '${guild.name}'`);
                    listenForRoleMenuButtonPress(message);
                }
            }
        }

        registerCommands(c, guild);
    }

    client.on(Events.InteractionCreate, async interaction => {
        handleInteraction(interaction);
    });
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);