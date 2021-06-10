import path from "path";

import { Airgram, Auth } from "airgram";
import { UserWrapper } from "./UserWrapper";

const commandPath: string = path.join(__dirname, "..", "td", "tdlib", "lib", "libtdjson");

export class AirgramWrapper
{
    private readonly _airgram: Airgram = new Airgram({
        apiId: parseInt(process.env.API_ID!),
        apiHash: process.env.API_HASH!,
        command: commandPath,
        logVerbosityLevel: 2
    });
    private readonly _user: UserWrapper = new UserWrapper(this._airgram);

    public constructor
    (
        private readonly _phoneNumber: string,
        private readonly _code: string
    )
    {
        this._airgram.use(new Auth({
            phoneNumber: this._phoneNumber,
            code: this._code
        }));
    }

    public get phoneNumber(): string
    {
        return this._phoneNumber;
    }

    public get airgram(): Airgram
    {
        return this._airgram;
    }

    public get user(): UserWrapper
    {
        return this._user;
    }
}