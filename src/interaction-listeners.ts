import { GuildMember, StringSelectMenuInteraction, Message, ButtonInteraction, InteractionResponse, GuildMemberRoleManager } from 'discord.js';
import config from './config.json';
import { buildDivisionSelectionMessage, getMemberDivisions } from './utils';
import { sendDepartmentSelection, sendDivisionSelection, sendPronounSelection } from './role-selection-messages';
import { saves } from '.';

const departments1 = config.departments.slice(0,18);
const departments2 = config.departments.slice(18);
const engineeringTypes = config.engineeringTypes;
const pronouns = config.pronouns;
const divisions = config.divisions;

export async function listenForDropdownRoleSelection(interaction: ButtonInteraction, response: InteractionResponse) {
    try {
        const confirmation = await response.awaitMessageComponent({ filter: (i: any) => i.user.id === interaction.user.id, time: 120000 }) as StringSelectMenuInteraction;
        
        if (!confirmation.values) {
            response.delete();
            return;
        }

        const member = interaction.member! as GuildMember;
        await member.fetch(true);
        const memberRoles = member.roles.cache;

        const actions = [];

        const availableRoles = {
            "selected_dept_1": departments1,
            "selected_dept_2": departments2,
            "selected_engineering_type": engineeringTypes,
            "selected_pronouns": pronouns
        }[confirmation.customId] ?? [];

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

        if (actions.length !== 0) {
            await confirmation.reply({ content: actions.join('\n'), components: [], ephemeral: true });
        } else {
            await confirmation.deferUpdate();
        }
        
        listenForDropdownRoleSelection(interaction, response); // Listen for the next dropdown selection
    } catch (e: any) {
        if (e.code === 'InteractionCollectorError') {
            await interaction.deleteReply();
        } else {
            console.error(e);
            interaction.editReply({ content: 'An unexpected error occurred :/', components: [] });
        }
    }
}

export async function listenForDivisionSelection(interaction: ButtonInteraction, response: InteractionResponse) {
    const { undergrad, grad, alum } = await getMemberDivisions(interaction.member! as GuildMember);

    const memberRoleManager = interaction.member!.roles as GuildMemberRoleManager;

    try {
        const confirmation = await response.awaitMessageComponent() as ButtonInteraction;
        let reply;
        if (confirmation.customId === 'undergrad') {
            if (undergrad) {
                await memberRoleManager.remove(divisions.undergrad.roleID);
                reply = await confirmation.reply({ content: 'You no longer have the `undergraduate` role.', ephemeral: true });
            } else {
                await memberRoleManager.add(divisions.undergrad.roleID);

                if (grad) {
                    await memberRoleManager.remove(divisions.grad.roleID);
                    reply = await confirmation.reply({ content: 'You no longer have the `graduate` role.\nYou now have the undergraduate role! Head to <#869429445163876412> to get more specific roles.', ephemeral: true });
                } else {
                    reply = await confirmation.reply({ content: 'You now have the undergraduate role! Head to <#869429445163876412> to get more specific roles.', ephemeral: true });
                }
            }
        } else if (confirmation.customId === 'grad') {
            if (grad) {
                await memberRoleManager.remove(divisions.grad.roleID);
                reply = await confirmation.reply({ content: 'You no longer have the `graduate` role.', ephemeral: true });
            } else {
                await memberRoleManager.add(divisions.grad.roleID);

                if (undergrad) {
                    await memberRoleManager.remove(divisions.undergrad.roleID);
                    reply = await confirmation.reply({ content: 'You no longer have the `undergraduate` role.\nYou now have the graduate role! Head to <#869074754227830854> to get more specific roles.', ephemeral: true });
                } else {
                    reply = await confirmation.reply({ content: 'You now have the graduate role! Head to <#869074754227830854> to get more specific roles.', ephemeral: true });
                }
            }
        } else if (confirmation.customId === 'alum') {
            if (alum) {
                await memberRoleManager.remove(divisions.alum.roleID);
                reply = await confirmation.reply({ content: 'You no longer have the `alumni` role.', ephemeral: true });
            } else {
                await memberRoleManager.add(divisions.alum.roleID);
                reply = await confirmation.reply({ content: 'You now have the alumni role! Head to <#877682997460095046> to get more specific roles.', ephemeral: true });
            }
        }

        await response.edit(await buildDivisionSelectionMessage(interaction.member as GuildMember));

        listenForDivisionSelection(interaction, response); // Listen for the next button press

    } catch (e: any) {
        if (e.code === 'InteractionCollectorError') {
            await interaction.deleteReply();
        } else {
            console.error(e);
            interaction.editReply({ content: 'An unexpected error occurred :/', components: [] });
        }
    }
}

export async function listenForRoleMenuButtonPress(message: Message) {
    try {
        const confirmation = await message.awaitMessageComponent() as ButtonInteraction;
        if (confirmation.customId === 'select_departments') {
            sendDepartmentSelection(confirmation);
        } else if (confirmation.customId === 'select_division') {
            sendDivisionSelection(confirmation);
        } else if (confirmation.customId === 'select_pronouns') {
            sendPronounSelection(confirmation);
        }

        listenForRoleMenuButtonPress(message); // Listen for the next button press

    } catch (e) {
        console.error(e);
    }
}