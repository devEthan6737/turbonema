import { Declare, Command, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, MediaGallery, MediaGalleryItem, ActionRow, Button } from 'seyfert';
import Database from '../../systems/Database/database';
import {  Brainrot, Profile, rarities, RarityMap } from '../../systems/Database/interfaces';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';
import { ColorResolvable, Formatter, TimestampStyle } from 'seyfert/lib/common';
import { createProfile } from '../../systems/Database/createProfile';
import ms from 'ms';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { addBrainrot } from '../../systems/containers';
import { addXP } from '../../systems/levels';

@Declare({
    name: "farm",
    description: "Farmea brainrots",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

export default class FarmCommand extends Command {
    async run(ctx: CommandContext) {
        const profiles = Database.getInstance('profiles');
        let profile: Profile;

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        if (profile.farm.restart < Date.now()) {
            profile.farm.restart = Date.now() + ms('30m');
            profile.farm.used = 0;
        } else if (profile.farm.used >= profile.farm.available) return ctx.write({
            content: `¡Te has quedado sin farmeos disponibles! **Se reinician ${Formatter.timestamp(new Date(profile.farm.restart), TimestampStyle.RelativeTime)}**\n\nConsume **50**<:auracoin:1454515337503576114> para obtener **10 farmeos ahora**`,
            components: [
                new ActionRow().addComponents(
                    new Button().setCustomId('buy10farms').setLabel('Comprar 10 farmeos').setEmoji('<:auracoin:1454515337503576114>').setStyle(ButtonStyle.Primary)
                )
            ]
        });

        profile.farm.used++;

        if (Math.floor(Math.random() * 101) < 30) {
            const xpToAdd = Math.floor(Math.random() * 21);
            profile.level = addXP(profile.level, xpToAdd);
            await profiles.set(ctx.author.id, profile);

            return ctx.write({
                content: `¡No se ha encontrado ningún Brainrot!\n\n**<:repost:1454139857633804491> Farmeos restantes :: ${profile.farm.available - profile.farm.used}**\n**⌛ Reinicio ${Formatter.timestamp(new Date(profile.farm.restart), TimestampStyle.RelativeTime)}**\n<:experiencia:1454102939026194502> **Has recibido ${xpToAdd}xp**`
            });
        }

        const brainrots = Database.getInstance('brainrots');
        const allBrainrots: { key: string, value: Brainrot }[] = await brainrots.all();
        const generableBrainrots: Brainrot[] = allBrainrots.map(brainrot => brainrot.value).filter((brainrot: Brainrot) => brainrot.levelRequeried <= profile.level.level);
        const brainrot = generableBrainrots[Math.floor(Math.random() * generableBrainrots.length)];
        const imageBuffer = Buffer.from(brainrot.base64Image, 'base64');
        const fileName = 'brainrot_image.png';
        const xpToAdd = Math.floor(Math.random() * 21);
        profile.level = addXP(profile.level, xpToAdd);

        await profiles.set(ctx.author.id, profile);

        const message = await ctx.write({
            files: [
                {
                    filename: fileName,
                    data: imageBuffer
                }
            ],
            components: [
                new Container().setColor(process.env.SECONDARY as ColorResolvable).addComponents(
                    new TextDisplay().setContent(`# Has encontrado un ${brainrot.name} ✨\n**${brainrot.name} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`**\n<:trofeo:1454102940720562306> **Nivel :: ${brainrot.levelRequeried}**\n**Precio de venta :: ${brainrot.buyPrice}**<:braincoin:1454101560903598307>\n\n**<:repost:1454139857633804491> Farmeos restantes :: ${profile.farm.available - profile.farm.used}**\n**⌛ Reinicio ${Formatter.timestamp(new Date(profile.farm.restart), TimestampStyle.RelativeTime)}**\n<:experiencia:1454102939026194502> **Has recibido ${xpToAdd}xp**`),
                    new Separator(),
                    new MediaGallery().setItems(
                        new MediaGalleryItem().setMedia(`attachment://${fileName}`)
                    ),
                    new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                ),
                new ActionRow().addComponents(
                    new Button().setCustomId('claim').setEmoji('<:obtenerahora:1454143782172753940>').setLabel('Reclamar').setStyle(ButtonStyle.Success),
                    new Button().setCustomId('scrap').setEmoji('<:braincoin:1454101560903598307>').setLabel(`Desechar`).setStyle(ButtonStyle.Danger)
                )
            ],
            flags: MessageFlags.IsComponentsV2
        }, true);

        const collector = message.createComponentCollector({
            filter: (i) => i.user.id == ctx.author.id
        });

        collector.run('claim', async (interaction: CollectorInteraction) => {
            collector.stop(); // para evitar que spameen el claim bro

            await interaction.deferUpdate();

            profile.level = addXP(profile.level, brainrot.xpReward);
            profile.brainrots = addBrainrot(brainrot.id, profile.brainrots);
            await profiles.set(ctx.author.id, profile);

            interaction.editMessage(message.id, {
                files: [
                    {
                        filename: fileName, 
                        data: imageBuffer
                    }
                ],
                components: [
                    new Container().setColor(process.env.SECONDARY as ColorResolvable).addComponents(
                        new TextDisplay().setContent(`# Has reclamado un ${brainrot.name} ✨\n**${brainrot.name} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`**\n<:trofeo:1454102940720562306> **Nivel :: ${brainrot.levelRequeried}**\n**Precio de venta :: ${brainrot.buyPrice}**<:braincoin:1454101560903598307>\n\n**<:repost:1454139857633804491> Farmeos restantes :: ${profile.farm.available - profile.farm.used}**\n**⌛ Reinicio ${Formatter.timestamp(new Date(profile.farm.restart), TimestampStyle.RelativeTime)}**\n<:experiencia:1454102939026194502> **¡Has recibido ${brainrot.xpReward}xp extra!**`),
                        new Separator(),
                        new MediaGallery().setItems(
                            new MediaGalleryItem().setMedia(`attachment://${fileName}`)
                        ),
                        new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                    )
                ]
            });
        });

        collector.run('scrap', async (interaction: CollectorInteraction) => {
            collector.stop(); // para evitar que spameen el scrap bro

            await interaction.deferUpdate();

            profile.money += brainrot.scrapValue;
            profile.brainrots = addBrainrot(brainrot.id, profile.brainrots);
            await profiles.set(ctx.author.id, profile);

            interaction.editMessage(message.id, {
                files: [
                    {
                        filename: fileName, 
                        data: imageBuffer
                    }
                ],
                components: [
                    new Container().setColor('Red').addComponents(
                        new TextDisplay().setContent(`# Has **reciclado** un ${brainrot.name} 🗑\n**${brainrot.name} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`**\n<:trofeo:1454102940720562306> **Nivel :: ${brainrot.levelRequeried}**\n\n**Has recibido ${brainrot.scrapValue}<:braincoin:1454101560903598307>**\n**<:repost:1454139857633804491> Farmeos restantes :: ${profile.farm.available - profile.farm.used}**\n**⌛ Reinicio ${Formatter.timestamp(new Date(profile.farm.restart), TimestampStyle.RelativeTime)}**\n<:experiencia:1454102939026194502> **No has obtenido xp extra.**`),
                        new Separator(),
                        new MediaGallery().setItems(
                            new MediaGalleryItem().setMedia(`attachment://${fileName}`)
                        ),
                        new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                    )
                ]
            });
        });
    }
}
