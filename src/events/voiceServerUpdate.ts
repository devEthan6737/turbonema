import { createEvent } from 'seyfert';

export default createEvent({
    data: { name: 'voiceServerUpdate' },
    async run(packet, client) {
        return client.voice.onVoiceServer({ ...packet, guild_id: packet.guildId });
    }
});
