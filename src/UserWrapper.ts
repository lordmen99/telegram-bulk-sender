import { Airgram, Message, toObject, User } from "airgram";

import { ChatWrapper } from "./ChatWrapper";

export class UserWrapper
{
    private _infos: User | null = null;
    private _allChats: Array<ChatWrapper> | null = null;

    public constructor
    (
        private readonly _airgram: Airgram
    )
    { }

    public async getInfos(): Promise<User>
    {
        if (this._infos === null)
        {
            // https://airgram.netlify.app/guides/basic-concepts/requests#type-guard-toobject
            this._infos = toObject(await this._airgram.api.getMe());
        }

        return this._infos;
    }

    public async sendTextMessage(chat: ChatWrapper, message: string): Promise<Message>
    {
        return toObject(await this._airgram.api.sendMessage({
            chatId: chat.id,
            inputMessageContent: {
                _: "inputMessageText",
                text: {
                  _: "formattedText",
                  text: message
                },
            }
        }));
    }

    private async _getAllChats(): Promise<Array<ChatWrapper>>
    {
        const { chatIds } = toObject(await this._airgram.api.getChats({
            limit: 100,
            offsetChatId: 0,
            offsetOrder: '9223372036854775807'
        }));

        return chatIds.map(chatId => new ChatWrapper(chatId, this._airgram));
    }

    public async getAllChats(forceReload: boolean = false): Promise<Array<ChatWrapper>>
    {
        if (this._allChats === null || forceReload)
        {
            this._allChats = await this._getAllChats();
        }

        return this._allChats;
    }
}
