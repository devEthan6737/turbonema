import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { join } from "node:path";
import { GuildCommandContext } from "seyfert";

export async function playLocalAudio (ctx: GuildCommandContext, audioFileName: string) {
    const voice = await ctx.member.voice();

    const connection = joinVoiceChannel({
        selfDeaf: false,
        selfMute: false,
        guildId: ctx.guildId,
        channelId: voice.channelId!,
        adapterCreator: ctx.client.voice.voiceAdapterCreator(ctx.guildId)
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 10000);

    const player = createAudioPlayer();
    const resource = createAudioResource(join(process.cwd(), 'assets', 'audios', audioFileName));

    player.play(resource);
    connection.subscribe(player);

    player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });
}