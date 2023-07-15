import { StringSelectMenuOptionBuilder, ActionRowBuilder, GuildMember, JSONEncodable, APIActionRowComponent, APIMessageActionRowComponent, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from './config.json';

const divisions = config.divisions;

export async function buildDivisionSelectionMessage(member: GuildMember) {
    const { undergrad, grad, alum } = await getMemberDivisions(member);

    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId('undergrad')
            .setLabel('Undergraduate')
            .setStyle(undergrad ? ButtonStyle.Primary : ButtonStyle.Secondary)
        )
        .addComponents(new ButtonBuilder()
            .setCustomId('grad')
            .setLabel('Graduate')
            .setStyle(grad ? ButtonStyle.Primary : ButtonStyle.Secondary)
        )
        .addComponents(new ButtonBuilder()
            .setCustomId('alum')
            .setLabel('Alumni')
            .setStyle(alum ? ButtonStyle.Success : ButtonStyle.Secondary)
        ) as JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>;

    return { content: 'Choose your division', components: [row], ephemeral: true };
}

export interface ConfigRole {
    name: string;
    roleID: string;
    emoji?: string;
}

export async function generateDropdownOptions(member: GuildMember, roles: ConfigRole[]) {
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

export async function getMemberDivisions(member: GuildMember) {
    await member.fetch(true);

    const memberRoles = member.roles.cache;
    let undergrad = false;
    let grad = false;
    let alum = false;

    for (const role of memberRoles) {
        if (role[0] == divisions.undergrad.roleID) {
            undergrad = true;
        } else if (role[0] == divisions.grad.roleID) {
            grad = true;
        } else if (role[0] == divisions.alum.roleID) {
            alum = true;
        }
    }

    return { undergrad, grad, alum };
}