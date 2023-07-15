import { readFile, writeFile } from "fs/promises";

export interface SavedMessage {
    id: string;
    channelId: string;
    sentAt: number;
}

export interface SaveData {
    roleMenuMessages: SavedMessage[];
}

export default function(guildId: string) {
    let data: SaveData = {
        roleMenuMessages: []
    };

    return {
        async loadData() {
            try {
                data = JSON.parse(await readFile(`./save/${guildId}.json`, 'utf-8'));
            } catch (e: any) {
                if (e.code === 'ENOENT') {
                    console.log('No save file found.');
                } else {
                    console.error(e);
                }

            }
        },

        async saveData() {
            await writeFile(`./save/${guildId}.json`, JSON.stringify(data));
        },

        getRoleMenuMessages() {
            return data.roleMenuMessages;
        },

        async addRoleMenuMessage(msg: SavedMessage) {
            data.roleMenuMessages.push(msg);
            await this.saveData();
        }
    }
}