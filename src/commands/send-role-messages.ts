import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, CommandInteraction, JSONEncodable, APIActionRowComponent, APIMessageActionRowComponent, EmbedBuilder, ButtonBuilder, ButtonStyle, GuildTextBasedChannel } from 'discord.js';
import { listenForRoleMenuButtonPress } from '../interaction-listeners';
import { saves } from '..';

export default {
    data: new SlashCommandBuilder()
        .setName('send-role-messages')
        .setDescription('Send the form messages to select roles in a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('channel').setDescription('The channel to send the messages to').setRequired(true)),

    execute: async (interaction: CommandInteraction) => {
        const channel = interaction.options.get('channel')!.channel! as GuildTextBasedChannel;

        const embed = new EmbedBuilder()
            .setTitle('Role selection')
            .setDescription('Use the buttons below to select your roles.')
            .setColor('#4E84D6');

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('select_departments')
                    .setLabel('Select department roles')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('select_division')
                    .setLabel('Select division role(s)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('select_pronouns')
                    .setLabel('Select pronoun roles')
                    .setStyle(ButtonStyle.Success),
            );

        const message = await channel.send({ embeds: [embed], components: [buttons as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>] });
        
        listenForRoleMenuButtonPress(message);

        saves[channel.guild.id].addRoleMenuMessage({id: message.id, channelId: channel.id, sentAt: message.createdTimestamp});
        await interaction.reply({ content: 'Message sent', ephemeral: true });
    }
}