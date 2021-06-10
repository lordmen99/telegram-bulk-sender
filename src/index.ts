import path from "path";

import { Chat, User } from "airgram";
import express from "express";

import { AirgramWrapper } from "./AirgramWrapper";
import { ChatWrapper } from "./ChatWrapper";
import { settings, IChatsList } from "./SettingsManager";

interface IChatData {
    id: number,
    title: string
}

interface IUserData {
    firstName: string
}

settings.initSync();
console.log("Settings loaded");

const app: express.Application = express();

const publicPath: string = path.join(__dirname, "..", "public");
const buildPath: string = path.join(publicPath, "build");

let currentUser: AirgramWrapper | null = null;

function successfulResponse(data: any)
{
    return {
        success: true,
        data
    };
}

function errorResponse(error: any)
{
    return {
        success: false,
        error
    };
}

console.log(`Serving public folder ${publicPath}`);
console.log(`Serving public build folder ${buildPath}`);

// JSON body parser
app.use(express.json())

.use("/", express.static(publicPath))
.use("/", express.static(buildPath))

.post("/auth", async (req: express.Request, res: express.Response) =>
{
    const { phoneNumber, code }: { phoneNumber: string, code: string } = req.body;

    if (currentUser !== null)
    {
        console.log(`Destroying last session`);
        await currentUser.airgram.api.logOut();
        await currentUser.airgram.destroy();
    }

    currentUser = new AirgramWrapper(phoneNumber, code);

    console.log(`Now connecting with ${phoneNumber} and ${code}`);

    const infos = await currentUser.user.getInfos();
    console.log(infos);

    try {
        res.json(successfulResponse({
            firstName: infos.firstName
        }));
    }
    catch (e) {
        res.json(errorResponse(e));
    }
})

.get("/getChats", async (req: express.Request, res: express.Response) =>
{
    if (currentUser === null)
    {
        res.json(errorResponse(new Error("Not connected")));
    }
    else
    {
        const chats: Array<ChatWrapper> = await currentUser.user.getAllChats();

        const data: Array<IChatData> = await Promise.all(chats.map(async (chat: ChatWrapper): Promise<IChatData> =>
        {
            const infos: Chat = await chat.getInfos();

            return {
                id: chat.id,
                title: infos.title
            };
        }));

        res.json(successfulResponse(data));
    }
})

.get("/getCurrentUser", async (req: express.Request, res: express.Response) =>
{
    if (currentUser === null)
    {
        return res.json(errorResponse(new Error("Not connected")));
    }

    const infos: User = await currentUser?.user.getInfos();

    res.json(successfulResponse({
        firstName: infos.firstName
    }));
})

.post("/sendMessages", async (req: express.Request, res: express.Response) =>
{
    const { chatsIds, message }: { chatsIds: Array<number>, message: string } = req.body;

    if (currentUser === null)
    {
        return res.json(errorResponse(new Error("Not connected")));
    }

    const allChats: Array<ChatWrapper> = await currentUser.user.getAllChats();
    const sendErrors: Array<any> = [];
    let messagesSentCount: number = 0;

    for (const chat of allChats)
    {
        if (chatsIds.includes(chat.id))
        {
            try {
                await currentUser.user.sendTextMessage(chat, message);
                messagesSentCount++;
            }
            catch (e) {
                sendErrors.push(e);
            }
        }
    }

    res.json(successfulResponse({
        messagesSentCount,
        sendErrors
    }));
})

.get("/getChatsLists", (req: express.Request, res: express.Response) =>
{
    if (currentUser === null)
    {
        return res.json(errorResponse(new Error("Not connected")));
    }

    const phoneNumber: string = currentUser.phoneNumber;
    const chatsLists: Array<IChatsList> = settings.getChatsLists(phoneNumber);

    settings.persistSync();

    res.json(successfulResponse(chatsLists));
})

.post("/createChatsList", (req: express.Request, res: express.Response) =>
{
    if (currentUser === null)
    {
        return res.json(errorResponse(new Error("Not connected")));
    }

    const phoneNumber: string = currentUser.phoneNumber;
    const name: string = req.body.name;
    const chatsIds: Array<number> = req.body.chatsIds;
    const chatsList: IChatsList = {
        name,
        chatsIds
    };

    settings.appendChatsList(phoneNumber, chatsList);
    settings.persistSync();

    res.json(successfulResponse(chatsList));
})

app.listen(8080);
