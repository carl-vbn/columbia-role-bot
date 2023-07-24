import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, ButtonInteraction, EmbedBuilder, GuildMember, GuildTextBasedChannel, JSONEncodable, StringSelectMenuBuilder } from "discord.js";
import { buildDivisionSelectionMessage, generateDropdownOptions } from "./utils";
import { listenForDivisionSelection, listenForDropdownRoleSelection } from "./interaction-listeners";

import config from './config.json';
import { saves } from ".";

const departments1 = config.departments.slice(0,18);
const departments2 = config.departments.slice(18);
const engineeringTypes = config.engineeringTypes;
const pronouns = config.pronouns;

export async function sendDepartmentSelection(interaction: ButtonInteraction) {
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

    console.log(`[${Date.now()}] Sending department selection to ${interaction.user.tag} in #${(interaction.channel as GuildTextBasedChannel).name} in ${interaction.guild?.name} (${interaction.guild?.id})`);
    const response = await interaction.reply({ content: 'Choose your department(s)', components: [row1, row2, row3], ephemeral: true });

    console.log(`[${Date.now()}] Listening for department selection from ${interaction.user.tag} in #${(interaction.channel as GuildTextBasedChannel).name} in ${interaction.guild?.name} (${interaction.guild?.id})`);
    listenForDropdownRoleSelection(interaction, response);
}

export async function sendPronounSelection(interaction: ButtonInteraction) {
    const row = new ActionRowBuilder()
        .addComponents(new StringSelectMenuBuilder()
            .setCustomId('selected_pronouns')
            .setPlaceholder('Pronouns')
            .setMinValues(0)
            .setMaxValues(pronouns.length)
            .addOptions(await generateDropdownOptions(interaction.member as GuildMember, pronouns))
        ) as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>;

    const response = await interaction.reply({ embeds: [new EmbedBuilder().setColor('#4E84D6').setTitle('What are your pronouns?').setDescription('(feel free to choose all that apply)')], components: [row], ephemeral: true });

    listenForDropdownRoleSelection(interaction, response);
}

export async function sendDivisionSelection(interaction: ButtonInteraction) {
    const response = await interaction.reply(await buildDivisionSelectionMessage(interaction.member as GuildMember));

    listenForDivisionSelection(interaction, response);
}