import { type GatewayVoiceServerUpdateDispatchData, type GatewayVoiceStateUpdateDispatchData } from "seyfert/lib/types";
import { Client } from "seyfert";

/**
 * @author SNIPPIK
 * @description Class for interaction with client websocket
 * @class VoiceManager
 */
export class VoiceAdapter<T extends Client> {
    /**
     * @description Collection of adapters for voice communication with client websocket
     * @readonly
     * @private
     */
    public readonly adapters = new Map<string, DiscordGatewayAdapterLibraryMethods>();

    /**
     * @description Create a class
     * @param client - Client class
     */
    public constructor(private client: T) {};

    /**
     * @description Voice state adapter for this guild, which can be used with `@discordjs/voice` to play audio in voice and stage channels.
     * @public
     */
    public voiceAdapterCreator = (guildID: string): DiscordGatewayAdapterCreator => {
        // If no shard ID
        const id = this.client.gateway.calculateShardId(guildID);

        return methods => {
            this.adapters.set(guildID, methods);

            return {
                sendPayload: (data) => {
                    this.client.gateway.send(id, data);
                    return true;
                },
                destroy: () => {
                    this.adapters.delete(guildID);
                }
            };
        };
    };

    /**
     * @description Find the voice adapter from the VOICE_SERVER_UPDATE data and data transfer
     * @param payload - Voice state data
     */
    public onVoiceServer = (payload: GatewayVoiceServerUpdateDispatchData) => {
        this.adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
    };

    /**
     * @description Find the voice adapter from the VOICE_STATE_UPDATE data and data transfer
     * @param payload - Voice state data
     */
    public onVoiceStateUpdate = (payload: GatewayVoiceStateUpdateDispatchData) => {
        this.adapters.get(payload.guild_id!)?.onVoiceStateUpdate(payload);
    };
}

/**
 * @description Discord Gateway Adapter, Discord Gateway.
 * @interface DiscordGatewayAdapterLibraryMethods
 */
export interface DiscordGatewayAdapterLibraryMethods {
    /**
     * @description Call this when the adapter can no longer be used (e.g. due to a disconnect from the main gateway)
     */
    destroy(): void;
    /**
     * @description Call this when you receive a VOICE_SERVER_UPDATE payload that is relevant to the adapter.
     * @param data - The inner data of the VOICE_SERVER_UPDATE payload
     */
    onVoiceServerUpdate(data: GatewayVoiceServerUpdateDispatchData): void;
    /**
     * @description Call this when you receive a VOICE_STATE_UPDATE payload that is relevant to the adapter.
     * @param data - The inner data of the VOICE_STATE_UPDATE payload
     */
    onVoiceStateUpdate(data: GatewayVoiceStateUpdateDispatchData): void;
}

/**
 * @description Methods provided by the Discord Gateway adapter implementer for the DiscordGatewayAdapter.
 * @interface DiscordGatewayAdapterImplementerMethods
 */
export interface DiscordGatewayAdapterImplementerMethods {
    /**
     * @description This will be called by voice when the adapter is safe to destroy because it will no longer be used.
     */
    destroy(): void;
    /**
     * @description Implement this method so that this payload is sent to the underlying Discord gateway connection.
     * @param payload - The payload to send to the main Discord gateway connection
     * @returns `false` if the payload was definitely not sent - in which case the voice connection is disconnected
     */
    sendPayload(payload: any): boolean;
}

/**
 * A function used to create adapters. It takes a methods parameter containing functions that
 * can be called by the developer when new data is received on their gateway connection. In turn,
 * the developer will return some methods that the library can call - for example, to send messages to the
 * gateway or to signal that the adapter can be removed.
 * @type DiscordGatewayAdapterCreator
 */
export type DiscordGatewayAdapterCreator = ( methods: DiscordGatewayAdapterLibraryMethods) => DiscordGatewayAdapterImplementerMethods;
