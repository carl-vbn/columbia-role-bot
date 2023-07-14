import { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, GuildMember, CommandInteraction, JSONEncodable, APIActionRowComponent, APIMessageActionRowComponent, StringSelectMenuInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, GuildTextBasedChannel, Message, ButtonInteraction, InteractionResponse } from 'discord.js';
import config from '../config.json';

const departments1 = config.departments.slice(0,18);
const departments2 = config.departments.slice(18);
const engineeringTypes = config.engineeringTypes;

interface ConfigRole {
    name: string;
    roleID: string;
    emoji?: string;
}

async function generateDropdownOptions(member: GuildMember, roles: ConfigRole[]) {
    await member.fetch(true);

    return roles.map(role => {
        const guildRole = member.guild.roles.cache.get(role.roleID);

        const optionBuilder = new StringSelectMenuOptionBuilder()
            .setLabel(role.name)
            .setValue(role.roleID)
            .setDefault(guildRole ? member.roles.cache.has(guildRole.id) : false);

        if (role.emoji) {
            optionBuilder.setEmoji(role.emoji);
        }

        return optionBuilder;
    });
}

async function listenForDropdownSelections(interaction: ButtonInteraction, response: InteractionResponse) {
    try {
        const confirmation = await response.awaitMessageComponent({ filter: (i: any) => i.user.id === interaction.user.id, time: 120000 }) as StringSelectMenuInteraction;
        
        const member = interaction.member! as GuildMember;
        await member.fetch(true);
        const memberRoles = member.roles.cache;

        const actions = [];

        const availableRoles = confirmation.customId === 'selected_dept_1' ? departments1 : (confirmation.customId === 'selected_dept_2' ? departments2 : (confirmation.customId === 'selected_engineering_type' ? engineeringTypes : []));
        for (const role of memberRoles) {
            if (availableRoles.some(r => r.roleID === role[0])) {
                if (!confirmation.values.includes(role[0])) {
                    await member.roles.remove(role[0]);
                    actions.push(`Removed \`${role[1].name}\``);
                }
            }
        }

        for (const roleId of confirmation.values) {
            if (!memberRoles.has(roleId)) {
                await member.roles.add(roleId);
                const role = await member.guild.roles.fetch(roleId);
                actions.push(`Added \`${role?.name}\``);
            }
        }

        console.log(actions);
        await confirmation.reply({ content: actions.join('\n'), components: [] });
        
        listenForDropdownSelections(interaction, response); // Listen for the next dropdown selection
    } catch (e) {
        await interaction.deleteReply();
    }

}

async function sendDepartmentSelection(interaction: ButtonInteraction) {

    const row1 = new ActionRowBuilder()
        .addComponents(new StringSelectMenuBuilder()
            .setCustomId('selected_dept_1')
            .setPlaceholder('Department roles (1/2)')
            .setMinValues(0)
            .setMaxValues(departments1.length)
            .addOptions(await generateDropdownOptions(interaction.member as GuildMember, departments1))
        ) as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>;

    const row2 = new ActionRowBuilder()
        .addComponents(new StringSelectMenuBuilder()
            .setCustomId('selected_dept_2')
            .setPlaceholder('Department roles (2/2)')
            .setMinValues(0)
            .setMaxValues(departments2.length)
            .addOptions(await generateDropdownOptions(interaction.member as GuildMember, departments2))
        ) as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>;

    const row3 = new ActionRowBuilder()
        .addComponents(new StringSelectMenuBuilder()
            .setCustomId('selected_engineering_type')
            .setPlaceholder('Engineering')
            .setMinValues(0)
            .setMaxValues(engineeringTypes.length)
            .addOptions(await generateDropdownOptions(interaction.member as GuildMember, engineeringTypes))
        ) as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>;


    const response = await interaction.reply({ content: 'Choose your departments', components: [row1, row2, row3], ephemeral: true });

    listenForDropdownSelections(interaction, response);
}

async function listenForButtonPressed(message: Message) {
    const confirmation = await message.awaitMessageComponent() as ButtonInteraction;
    if (confirmation.customId === 'select_departments') {
        sendDepartmentSelection(confirmation);
    }

    listenForButtonPressed(message); // Listen for the next button press
}

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
                    .setLabel('Select division role')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('select_pronouns')
                    .setLabel('Select pronoun roles')
                    .setStyle(ButtonStyle.Success),
            );

        const message = await channel.send({ embeds: [embed], components: [buttons as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>] });
        
        listenForButtonPressed(message);

        await interaction.reply({ content: 'Message sent', ephemeral: true });
    }
}