import { REST, Routes, Client, OAuth2Guild, Events, Guild } from 'discord.js';

import sendRoleMessagesCommand from './commands/send-role-messages.js';

interface CommandData {
    name: string;
    description: string;
}

interface Command {
    data: CommandData;
    execute: (interaction: any) => Promise<void>;
}

const commands: Command[] = [];

commands.push(sendRoleMessagesCommand);

// and deploy your commands!
export const registerCommands = async (client: Client, guild: Guild) => {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

	try {
		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(client.application!.id, guild.id),
			{ body: commands.map(command => command.data) },
		);

		console.log(`Successfully reloaded ${(data as []).length} application (/) commands for guild ${guild.name}.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
    
        const command = commands.find(cmd => cmd.data.name == interaction.commandName);
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });
};