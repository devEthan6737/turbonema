import { Client, ParseClient, ParseMiddlewares, UsingClient } from "seyfert";
import { middlewares } from "./middlewares/middlewares";
import "dotenv/config";
import { onOptionsError, onPermissionsFail } from "./systems/overrides";
import ConfigInstance from "./systems/config";

const client = new Client({
    commands: {
        prefix: () => {
            return [ ConfigInstance.prefix ];
        },
        reply: () => true,
        defaults: {
            onOptionsError,
            onPermissionsFail
        }
    }
}) as UsingClient & Client;

client.setServices({
    middlewares: middlewares,
    cache: {
        disabledCache: {
            bans: true,
            emojis: true,
            stickers: true,
            roles: true,
            presences: true,
            stageInstances: true,
            voiceStates: true
        }
    }
});

client.start().then(async () => {
    await client.uploadCommands().catch(error => console.log(error));
});

declare module 'seyfert' {
    interface UsingClient extends ParseClient<Client<true>> {}
    interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof middlewares> {}
}

process.on('unhandledRejection', async (err) => {
    console.error(err);
});