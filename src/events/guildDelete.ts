import { Container, createEvent, Guild, Separator, TextDisplay } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';

export default createEvent({
    data: { name: 'guildDelete' },
    async run(guild, client): Promise<any> {
        if (guild.unavailable) return;
        if (!(guild instanceof Guild)) return


        client.messages.write('1456002904329683017', {
            components: [
                new Container().addComponents(
                    new TextDisplay().setContent(`## Expulsado de ${guild.name} (${guild.id})`),
                    new Separator(),
                    new TextDisplay().setContent(`Miembros: ${guild.memberCount}\nOwner: ${guild.ownerId}\nShard Id: ${guild.shardId}`),
                    new Separator(),
                    new TextDisplay().setContent(`-# Ahora estoy en ${(await client.guilds.list()).length} servidores.`)
                )   
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
});