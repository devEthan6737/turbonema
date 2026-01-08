import { createEvent } from "seyfert";

export default createEvent({
    data: { name: 'voiceStateUpdate' },
    async run(state, client) {
        const payload = state[0];

        if (!payload) return;

        client.voice.onVoiceStateUpdate({
            session_id: payload.sessionId,
            channel_id: payload.channelId,
            guild_id: payload.guildId,
            user_id: payload.userId,

            self_stream: payload.selfStream,
            self_video: payload.selfVideo,
            self_mute: payload.selfMute,
            self_deaf: payload.selfDeaf,
            request_to_speak_timestamp: payload.requestToSpeakTimestamp,

            deaf: payload.deaf,
            mute: payload.mute,
            suppress: payload.suppress,
            member: undefined
        });
    }
});
