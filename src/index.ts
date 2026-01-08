import { Client, ParseClient, ParseMiddlewares, UsingClient } from "seyfert";
import { middlewares } from "./middlewares/middlewares";
import "dotenv/config";
import { onOptionsError } from "./systems/overrides";
import ConfigInstance from "./systems/config";
import { VoiceAdapter } from "./voice/adapter";

const client = new Client({
    commands: {
        prefix: () => {
            return [ ConfigInstance.prefix ];
        },
        reply: () => true,
        defaults: {
            onOptionsError
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

client.voice = new VoiceAdapter(client);

client.start().then(async () => {
    await client.uploadCommands().catch(error => console.log(error));
});

declare module 'seyfert' {
    interface UsingClient extends ParseClient<Client<true>> {}
    interface RegisteredMiddlewares
    extends ParseMiddlewares<typeof middlewares> {}
    interface Client {
        voice: VoiceAdapter<this>
    }
}

process.on('unhandledRejection', async (err) => {
    console.error(err);
});