import { Embed, TopLevelBuilders } from 'seyfert';
import { InteractionCreateBodyRequest, MessageCreateBodyRequest } from 'seyfert/lib/common';
import { APIEmbed, MessageFlags } from 'seyfert/lib/types';

export interface MessageBase {
    content?: string | null | undefined;
    embeds?: Embed[] | APIEmbed[];
    components?: TopLevelBuilders[] | ReturnType<TopLevelBuilders['toJSON']>[];
    flags?: MessageFlags;
}

export class MessageInstance {
    public message: MessageBase;

    constructor(message: MessageBase) {
        this.message = message;
    }

    public get(): InteractionCreateBodyRequest | MessageCreateBodyRequest {
        return this.message as InteractionCreateBodyRequest | MessageCreateBodyRequest;
    }

    public getContent(): MessageBase['content'] {
        return this.message.content;
    }

    public getEmbeds(): MessageBase['embeds'] {
        return this.message.embeds;
    }

    public getComponents(): MessageBase['components'] {
        return this.message.components;
    }

    public edit(newMessage: MessageBase) {
        this.message = newMessage;
    }
}

export class MessageInstanceCallback extends MessageInstance {
    private cb;

    constructor(callback: (...params: any) => Promise<MessageBase>) {
        super({});
        this.cb = callback;
    }

    public async resolve(...params: any): Promise<InteractionCreateBodyRequest | MessageCreateBodyRequest> {
        const newMessage = await this.cb(params);
        this.message = newMessage;

        return this.message as InteractionCreateBodyRequest | MessageCreateBodyRequest;
    }

    public update(callback: (message: MessageBase) => InteractionCreateBodyRequest | MessageCreateBodyRequest): InteractionCreateBodyRequest | MessageCreateBodyRequest {
        const cb = callback(this.message);

        this.message = cb as MessageBase;

        return cb;
    }
}