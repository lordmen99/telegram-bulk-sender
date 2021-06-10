import path from "path";
import fs from "fs";

export interface IChatsList {
    name: string,
    chatsIds: Array<number>
}

interface ISettings {
    chatsLists: {
        [phoneNumber: string]: Array<IChatsList>
    }
}

class SettingsManager
{
    private _settings: ISettings | null = null;

    private get _dataFolder(): string
    {
        return path.join(__dirname, "..", "data");
    }

    private get _settingsFile(): string
    {
        return path.join(this._dataFolder, "settings.json");
    }

    private get settings(): ISettings
    {
        if (this._settings === null)
        {
            throw new Error("You must call initSync() before this method");
        }

        return this._settings;
    }

    private _loadSettingsFileSync(): void
    {
        const content: string = fs.readFileSync(this._settingsFile, "utf-8");

        this._settings = JSON.parse(content);
    }

    private _hasChatsLists(phoneNumber: string): boolean
    {
        return (typeof this.settings.chatsLists[phoneNumber] !== "undefined");
    }

    public appendChatsList(phoneNumber: string, chatsList: IChatsList): void
    {
        if (!this._hasChatsLists(phoneNumber))
        {
            this.settings.chatsLists[phoneNumber] = [];
        }

        this.settings.chatsLists[phoneNumber].push(chatsList);
    }

    public getChatsLists(phoneNumber: string): Array<IChatsList>
    {
        if (this._hasChatsLists(phoneNumber))
        {
            return this.settings.chatsLists[phoneNumber];
        }

        return [];
    }

    public initSync(): void
    {
        if (this._settings === null)
        {
            this._loadSettingsFileSync();
        }
    }

    public persistSync(): void
    {
        const content: string = JSON.stringify(this.settings);

        fs.writeFileSync(this._settingsFile, content, {
            encoding: "utf-8",
            flag: "w"
        });
    }
}

export const settings: SettingsManager = new SettingsManager();