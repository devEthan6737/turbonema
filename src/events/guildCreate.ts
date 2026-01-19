import { Container, createEvent, MediaGallery, MediaGalleryItem, Section, Separator, TextDisplay, Thumbnail } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';
import { addBrainrot } from '../systems/containers';
import Database from '../systems/Database/database';
import { Profile } from '../systems/Database/interfaces';
import { createProfile } from '../systems/Database/createProfile';

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

        const brainrots = Database.getInstance('brainrots');
        const brainrot = await brainrots.get('e30b23b0-5eff-46ae-9316-828b65c2e1ec');
        const imageBuffer = Buffer.from(brainrot.base64Image, 'base64');
        const fileName = 'brainrot_image.png';

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

        client.users.write(owner.id, {
            components: [
                new Container().addComponents(
                    new Section()
                    .addComponents(new TextDisplay().setContent(`## ¡Mil gracias por agregarme a **${guild.name}**!`))
                    .setAccessory(new Thumbnail().setMedia(guild.iconURL() ?? owner.avatarURL())),
                    new Separator(),
                    new TextDisplay().setContent(`Como compensación por elegirme, el equipo de desarrollo te obsequia con **800**<:braincoin:1454101560903598307> y una carta **Épica**.\n\n¡Usa \`/brainrots\` **para ver tu regalo**!\n**Sigue farmeando** con \`/farm\``),
                    new Separator(),
                    new MediaGallery().setItems(
                        new MediaGalleryItem().setMedia(`attachment://${fileName}`)
                    ),
                    new Separator(),
                    new TextDisplay().setContent(`-# Ahora estoy en ${(await client.guilds.list()).length} servidores gracias a ti ♥`)
                )
            ],
            files: [
                {
                    filename: fileName, 
                    data: imageBuffer
                }
            ],
            flags: MessageFlags.IsComponentsV2
        }).then(async () => {
            const profiles = Database.getInstance('profiles');
            let ownerProfile: Profile;

            if (!await profiles.has(owner.id)) {
                ownerProfile = await createProfile(null, owner.id);
                await profiles.set(owner.id, ownerProfile);
            } else ownerProfile = await profiles.get(owner.id);

            ownerProfile.money += 800;
            ownerProfile.brainrots = addBrainrot(brainrot.id, ownerProfile.brainrots);

            await profiles.set(owner.id, ownerProfile);
        }).catch((err) => {
            console.log(err);
        });
    }
});