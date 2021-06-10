import { EventEmitter } from "events";
import { getSelect, onReady } from "./DOMUtils";

export interface IChatsList {
    name: string,
    chatsIds: Array<number>
}

interface IGetChatsListResponseSuccess {
    success: true,
    data: Array<IChatsList>
}

interface IGetChatsListResponseError {
    success: false,
    error: string
}

interface ICreateChatsListResponseSuccess {
    success: true,
    data: IChatsList
}

interface ICreateChatsListResponseError {
    success: false,
    error: string
}

type ICreateChatsListResponse = ICreateChatsListResponseSuccess | ICreateChatsListResponseError;

type IGetChatsListResponse = IGetChatsListResponseSuccess | IGetChatsListResponseError;

export declare interface ChatsListsManager {
    on(event: "chatsListChange", listener: (chatsList: IChatsList) => void): this;

    emit(event: "chatsListChange", chatsList: IChatsList): any;
}

export class ChatsListsManager extends EventEmitter
{
    private readonly _$rootSelect: HTMLSelectElement;
    private readonly _$options: Map<HTMLOptionElement, IChatsList> = new Map<HTMLOptionElement, IChatsList>();
    private _chatsLists: Array<IChatsList> | null = null;

    public constructor()
    {
        super();

        this._$rootSelect = getSelect("chatsLists");

        onReady(() =>
        {
            this._$rootSelect.addEventListener("change", () => { this._triggerChange(); });
        });
    }

    private _getSelectedChatsList(): IChatsList
    {
        const selectedIndex: number = this._$rootSelect.selectedIndex;
        const $targetOption: HTMLOptionElement = this._$rootSelect.options[selectedIndex];
        const selectedChatsList: IChatsList | undefined = this._$options.get($targetOption);

        if (typeof selectedChatsList === "undefined")
        {
            throw new Error("Can't find selected chats list");
        }

        return selectedChatsList;
    }

    private _triggerChange(): void
    {
        this.emit("chatsListChange", this._getSelectedChatsList());
    }

    private get chatsLists(): Array<IChatsList>
    {
        if (this._chatsLists === null)
        {
            throw new Error("Chats lists not loaded");
        }

        return this._chatsLists;
    }

    private async _loadChatsLists(): Promise<void>
    {
        const response = await fetch("/getChatsLists");
        const requestResponse: IGetChatsListResponse = await response.json();

        if (requestResponse.success === false)
        {
            throw new Error("Failed to get chats lists");
        }

        this._chatsLists = requestResponse.data;
        this._$createOptions();
    }

    private _$createOptions(): void
    {
        this._$options.clear();

        for (const chatsList of this.chatsLists)
        {
            const $option = document.createElement("option");
            $option.innerText = chatsList.name;

            this._$options.set($option, chatsList);
        }
    }

    private _updateDOM(): void
    {
        this._$rootSelect.innerHTML = "";

        this._$options.forEach((value: IChatsList, $option: HTMLOptionElement): void =>
        {
            this._$rootSelect.appendChild($option);
        });
    }

    public async refresh()
    {
        // Load chats lists for the current user
        await this._loadChatsLists();
        // For each chats list, create an <option> element
        this._$createOptions();
        // Update the DOM by inserting the <option> elements into the root <select> element
        this._updateDOM();
    }

    public async createChatsList(chatsList: IChatsList): Promise<boolean>
    {
        const response: Response = await fetch("/createChatsList", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(chatsList)
        });
        const createResponse: ICreateChatsListResponse = await response.json();

        if (createResponse.success === true)
        {
            this.refresh();
        }

        return createResponse.success;
    }
}

export const chatsListsManager: ChatsListsManager = new ChatsListsManager();