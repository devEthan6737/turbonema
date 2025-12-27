import { Declare, Command, type CommandContext, IgnoreCommand, Embed, Button, ActionRow, AttachmentBuilder } from 'seyfert';
import Database from '../../systems/database/database';
import { Brainrot, Profile, rarities, RarityMap } from '../../systems/database/interfaces';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle } from 'seyfert/lib/types';
import { createProfile } from '../../systems/database/createProfile';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { playLocalAudio } from '../../systems/playAudio';

type ContextWriteOptions = Parameters<CommandContext["write"]>[0];
type CollectorWriteOptions = Parameters<CollectorInteraction["update"]>[0];

@Declare({
    name: "brainrots",
    description: "Visualiza todos tus brainrots",
    integrationTypes: ["GuildInstall"],
    ignore: IgnoreCommand.Message
})

export default class BrainrotsCommand extends Command {
    async run(ctx: CommandContext) {
        const profiles = Database.getInstance('profiles');
        let profile: Profile;

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        if (!profile || !profile.brainrots.length) return ctx.write({ content: "¡No tienes Brainrots!" });

        const brainrots = Database.getInstance('brainrots');
        const userBrainrots = await Promise.all(
            profile.brainrots.map(async (b) => {
                const info = await brainrots.get(b.id) as Brainrot;
                return { ...info, amount: b.amount };
            })
        );

        let currentPage = 0;
        const totalPages = userBrainrots.length;

        const getMessagePayload = (page: number): ContextWriteOptions => {
            const brainrot = userBrainrots[page];

            return {
                embeds: [
                    new Embed()
                        .setTitle(`${brainrot.name} ✨`)
                        .setColor(process.env.SECONDARY as ColorResolvable)
                        .setDescription(`Tienes **${brainrot.amount} de ${brainrot.name} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`**\n**<:experiencia:1454102939026194502> Nivel :: \`${brainrot.levelRequeried}\`**\n**A la venta por \`${brainrot.buyPrice}\`<:braincoin:1454101560903598307>**\n**Desechable por \`${brainrot.scrapValue}\`<:braincoin:1454101560903598307>**`)
                        .setImage('attachment://brainrot.png')
                        .setFooter({ text: `Brainrot ${page + 1} de ${totalPages}` })
                ],
                components: [
                    new ActionRow().addComponents(
                        new Button().setCustomId('prev').setLabel('↢').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                        new Button().setCustomId('page').setLabel(`${page + 1}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new Button().setCustomId('next').setLabel('↣').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                    ),
                    new ActionRow().addComponents(
                        new Button().setCustomId('reproduce').setLabel('Reproducir').setEmoji('<:reproducir:1454196963632353484>').setStyle(ButtonStyle.Success)
                    )
                ],
                files: [ new AttachmentBuilder().setName('brainrot.png').setFile('buffer', Buffer.from(brainrot.base64Image, "base64")) ]
            };
        };

        const message = await ctx.write(getMessagePayload(currentPage), true);

        const collector = message.createComponentCollector({
            filter: (i) => i.user.id === ctx.author.id,
            timeout: 60000
        });

        collector.run([ 'next', 'prev' ], async (interaction: CollectorInteraction) => {
            if (interaction.customId === 'next') {
                if (currentPage < totalPages - 1) currentPage++;
            } else if (interaction.customId === 'prev') {
                if (currentPage > 0) currentPage--;
            }

            await interaction.update(getMessagePayload(currentPage) as CollectorWriteOptions);
        });

        collector.run('reproduce', async (interaction: CollectorInteraction) => {
            playLocalAudio(await (await interaction.member?.voice())?.channel(), ctx, userBrainrots[currentPage].audioFileName);
        });
    }
}