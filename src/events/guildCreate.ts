import { Container, createEvent, Section, Separator, TextDisplay, Thumbnail } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';

export default createEvent({
    data: { name: 'guildCreate' },
    async run(guild, client): Promise<any> {
        if (guild.unavailable) return;

        const owner = await guild.fetchOwner(true);
        if (!owner) return client.messages.write('1456002904329683017', {
            components: [
                new Container().addComponents(
                    new TextDisplay().setContent(`## Agregado a ${guild.name} (${guild.id})`),
                    new Separator(),
                    new TextDisplay().setContent(`Miembros: ${guild.memberCount}\nOwner: ${guild.ownerId}\nShard Id: ${guild.shardId}`),
                    new Separator(),
                    new TextDisplay().setContent(`-# Ahora estoy en ${(await client.guilds.list()).length} servidores.`)
                )   
            ],
            flags: MessageFlags.IsComponentsV2
        });

        client.messages.write('1456002904329683017', {
            components: [
                new Container().addComponents(
                    new Section()
                    .addComponents(new TextDisplay().setContent(`## Agregado a ${guild.name} (${guild.id})`))
                    .setAccessory(new Thumbnail().setMedia(guild.iconURL() ?? owner.avatarURL())),
                    new Separator(),
                    new Section()
                    .addComponents(new TextDisplay().setContent(`Miembros: ${guild.memberCount}\nOwner: ${owner.username} ${guild.ownerId}\nShard Id: ${guild.shardId}`))
                    .setAccessory(new Thumbnail().setMedia(owner.avatarURL())),
                    new Separator(),
                    new TextDisplay().setContent(`-# Ahora estoy en ${(await client.guilds.list()).length} servidores.`)
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
});