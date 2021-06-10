import Swal, { SweetAlertResult } from "sweetalert2";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt";
import "datatables.net-dt/css/jquery.dataTables.min.css";
import "datatables.net-select";
import "datatables.net-select-dt/css/select.dataTables.min.css";

import { chatsListsManager, IChatsList } from "./ChatsListsManager";
import { getButton, getInput } from "./DOMUtils";

import "../css/style.css";

interface IUser {
    firstName: string
}

interface IAuthResponseSuccess {
    success: true,
    data: IUser
}

interface IAuthResponseError {
    success: false,
    error: string
}

type IAuthResponse = IAuthResponseError | IAuthResponseSuccess;

interface ICurrentUserResponseSuccess {
    success: true,
    data: IUser
}

interface ICurrentUserResponseError {
    success: false,
    error: string
}

type ICurrentUserResponse = ICurrentUserResponseSuccess | ICurrentUserResponseError;

interface ISendMessageResultSuccess {
    success: true,
    data: {
        messagesSentCount: number,
        sendErrors: Array<Error>
    }
}

interface ISendMessageResultError {
    success: false,
    error: string
}

interface IChat {
    id: number,
    title: string
}

type ISendMessageResult = ISendMessageResultSuccess | ISendMessageResultError;

let table: DataTables.Api;

function getSelectedChats()
{
    const selectedRows: DataTables.Api = table.rows({ selected: true }).data();
    const selectedChats: Array<IChat> = [];
    const selectChatsIds: Array<number> = [];

    selectedRows.each((chat: IChat): void =>
    {
        selectedChats.push(chat);
        selectChatsIds.push(chat.id);
    })

    return {
        chats: selectedChats,
        chatsIds: selectChatsIds
    };
}

function selectChatsOfList(chatsList: IChatsList): void
{
    const allRows: DataTables.RowsMethods = table.rows();

    allRows.eq(0).each((index: number) =>
    {
        const row: DataTables.RowMethods = table.row(index);
        const data: IChat = row.data() as IChat;

        if (chatsList.chatsIds.includes(data.id))
        {
            row.select();
        }
        else
        {
            row.deselect();
        }
    });
}

async function auth(phoneNumber: string, code: string): Promise<IUser>
{
    const authData = {
        phoneNumber,
        code
    };

    const response: Response = await fetch("/auth", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(authData)
    });

    const result: IAuthResponse = await response.json();

    if (result.success === true)
    {
        return result.data;
    }

    throw new Error(`Server error : ${result.error}`);
}

async function askForAuth(): Promise<IUser>
{
    let phoneNumber: string = "";

    // Déjà, on fait un mixin contenant la configuration commune
    const swalQueueStep = Swal.mixin({
        confirmButtonText: "Suivant",
        cancelButtonText: "Retour",
        progressSteps: [ "1", "2" ],
        reverseButtons: true,
        inputAttributes: {
            required: "required"
        },
        validationMessage: "Champ requis"
    });

    const resultPhoneNumber: SweetAlertResult<string> = await swalQueueStep.fire<string>({
        title: "Votre numéro de téléphone",
        input: "tel",
        inputPlaceholder: "+33712345678",
        showCancelButton: true,
        currentProgressStep: "1"
        }
    );

    if (!resultPhoneNumber.isConfirmed)
    {
        throw new Error("Dismissed or denied");
    }

    phoneNumber = resultPhoneNumber.value!;

    const resultCode: SweetAlertResult<IUser> = await swalQueueStep.fire<Promise<IUser>>({
        title: "Votre code de connexion",
        input: "text",
        inputPlaceholder: "123456",
        showCancelButton: true,
        currentProgressStep: "2",
        preConfirm(code: string) {
            return auth(phoneNumber, code);
        }
    });

    if (!resultCode.isConfirmed)
    {
        throw new Error("Dismissed or denied");
    }

    return resultCode.value!;
}

function showChats()
{
    $(function() {
        table = $("#chats").DataTable({
            pageLength: 50,
            ajax: "/getChats",
            columnDefs: [ {
                orderable: false,
                className: 'select-checkbox',
                targets:   0,
                defaultContent: ""
            },
            {
                data: "id",
                targets: 1
            },
            {
                data: "title",
                targets: 2
            } ],
            select: {
                style:    'multi',
                selector: 'td:first-child'
            },
            order: [[ 1, 'asc' ]]
        });
    });
}

async function getCurrentUser(): Promise<IUser | null>
{
    const response = await fetch("/getCurrentUser");
    const data: ICurrentUserResponse = await response.json();

    if (data.success)
    {
        return data.data;
    }

    return null;
}

function enableSendMessageButton(): void
{
    const $sendMessageButton: HTMLButtonElement = getButton("sendMessageButton");

    $sendMessageButton.disabled = false;
    $sendMessageButton.addEventListener("click", async () =>
    {
        const selectedChatsIds = getSelectedChats().chatsIds;

        if (selectedChatsIds.length === 0)
        {
            Swal.fire({
                icon: "info",
                text: "Vous devez sélectionner au moins un channel"
            });
        }
        else
        {
            const askForMessageResult: SweetAlertResult<string> = await askForMessage();

            if (!askForMessageResult.isConfirmed) return;

            const showSendMessageBoxResult: SweetAlertResult<ISendMessageResult> = await showSendMessageBox(
                selectedChatsIds,
                askForMessageResult.value!
            );

            if (showSendMessageBoxResult.isConfirmed)
            {
                const messageResult: ISendMessageResult = showSendMessageBoxResult.value!;

                if (messageResult.success === true)
                {
                    Swal.fire({
                        title: `${messageResult.data.messagesSentCount} message(s) envoyé(s)`,
                        text: `${messageResult.data.sendErrors.length} erreurs`,
                        icon: "success"
                    });
                }
                else
                {
                    Swal.fire({
                        title: `Erreur`,
                        text: messageResult.error,
                        icon: "error"
                    });
                }
            }
        }
    });
}

async function sendMessageToChats(chatsIds: Array<number>, message: string): Promise<ISendMessageResult>
{
    const sendData = {
        chatsIds,
        message
    };

    const response = await fetch("/sendMessages", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sendData)
    });
    
    return await response.json() as ISendMessageResult;
}

async function showSendMessageBox(chatsIds: Array<number>, message: string): Promise<SweetAlertResult<ISendMessageResult>>
{
    return await Swal.fire<Promise<ISendMessageResult>>({
        title: `Envoyer le message à ${chatsIds.length} channels ?`,
        icon: "warning",
        allowEscapeKey: false,
        allowEnterKey: false,
        allowOutsideClick: false,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "C'est parti !",
        preConfirm() {
            return sendMessageToChats(chatsIds, message);
        }
    });
}

async function askForMessage(): Promise<SweetAlertResult<string>>
{
    return await Swal.fire<string>({
        icon: "question",
        text: "Entrez votre message",
        input: "textarea",
        inputAttributes: {
            required: "required"
        },
        validationMessage: "Champ requis",
        confirmButtonText: "Envoyer"
    });
}

async function main()
{
    let currentUser: IUser | null = await getCurrentUser();

    if (currentUser === null)
    {
        currentUser = await askForAuth();
    }

    try {
        await chatsListsManager.refresh();

        getButton("createChatsListButton").addEventListener("click", async () =>
        {
            const input: HTMLInputElement = getInput("newChatsListName");
            const name: string = input.value;
            const selectedChatsIds: Array<number> = getSelectedChats().chatsIds;

            const creationSuccess: boolean = await chatsListsManager.createChatsList({
                name,
                chatsIds: selectedChatsIds
            });

            Swal.fire({
                icon: (creationSuccess ? "success" : "error"),
                showConfirmButton: false,
                timer: 1500
            });
        });
    }
    catch (e) {
        Swal.fire({
            icon: "error",
            title: "Can't load chats lists",
            text: e.message
        });
    }

    enableSendMessageButton();

    chatsListsManager.on("chatsListChange", (chatsList: IChatsList) =>
    {
        selectChatsOfList(chatsList);
    });

    Swal.fire({
        icon: "success",
        title: `Logged as ${currentUser.firstName}`
    });

    try {
        showChats();
    }
    catch (e) {
        Swal.fire({
            icon: "error",
            text: e.message
        });
    }
}

main();