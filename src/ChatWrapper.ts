import { toObject, Chat, Airgram } from "airgram";

export class ChatWrapper
{
    private _infos: Chat | null = null;

    public constructor
    (
        private readonly _chatId: number,
        private readonly _airgram: Airgram
    )
    { }

    public get id(): number
    {
        return this._chatId;
    }

    public async getInfos(): Promise<Chat>
    {
        if (this._infos === null)
        {
            this._infos = toObject(await this._airgram.api.getChat({
                chatId: this._chatId
            }));
        }

        return this._infos;
    }
}
