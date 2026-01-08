import { Declare, type CommandContext, IgnoreCommand, Embed, Button, ActionRow, AttachmentBuilder, SubCommand } from 'seyfert';
import Database from '../../../systems/Database/database';
import { Brainrot, Profile, rarities, RarityMap, Shop } from '../../../systems/Database/interfaces';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';
import { createProfile } from '../../../systems/Database/createProfile';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { addBrainrot } from '../../../systems/containers';

type ContextWriteOptions = Parameters<CommandContext["write"]>[0];
type CollectorWriteOptions = Parameters<CollectorInteraction["update"]>[0];

@Declare({
    name: "list",
    description: "Lista tus Brainrots en venta",
    integrationTypes: ["GuildInstall"],
    ignore: IgnoreCommand.Message
})

export default class ListShopCommand extends SubCommand {
    async run(ctx: CommandContext) {
        const profiles = Database.getInstance('profiles');
        let profile: Profile;

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        if (!profile.onSale.length) return ctx.write({ content: "¡No tienes Brainrots en venta!" });

        const brainrots = Database.getInstance('brainrots');
        const shop = Database.getInstance('shop');

        let userOnSaleBrainrots = await Promise.all(
            profile.onSale.map(async (b) => {
                const info = await brainrots.get(b) as Brainrot;
                const shopInfo: Shop = await shop.get(`${ctx.author.id}:${b}`);
                return { ...info, salePrice: shopInfo.price };
            })
        );

        let currentPage = 0;
        const totalPages = userOnSaleBrainrots.length;

        const getMessagePayload = (page: number): ContextWriteOptions => {
            const brainrot = userOnSaleBrainrots[page];

            return {
                embeds: [
                    new Embed()
                        .setTitle(`✨ ${brainrot.name} EN VENTA`)
                        .setColor(process.env.SECONDARY as ColorResolvable)
                        .setDescription(`${brainrot.name} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`\nA la venta por **${brainrot.salePrice}**<:braincoin:1454101560903598307>\n\n**<:experiencia:1454102939026194502> Nivel :: \`${brainrot.levelRequeried}\`**\n**A la venta por \`${brainrot.buyPrice}\`<:braincoin:1454101560903598307>**\n**Desechable por \`${brainrot.scrapValue}\`<:braincoin:1454101560903598307>**`)
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
                        new Button().setCustomId('remove').setLabel('Retirar').setEmoji('🛒').setStyle(ButtonStyle.Secondary),
                    )
                ],
                files: [
                    new AttachmentBuilder().setName('brainrot.png').setFile('buffer', Buffer.from(brainrot.base64Image, "base64"))
                ]
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

        collector.run('remove', async (interaction: CollectorInteraction) => {
            const shops = Database.getInstance('shop');

            profile = await profiles.get(interaction.user.id);

            const brainrotFromPage = userOnSaleBrainrots[currentPage];

            if (!profile.onSale.includes(brainrotFromPage.id)) return interaction.write({
                content: 'No tienes este Brainrot en venta',
                flags: MessageFlags.Ephemeral
            });

            await shops.delete(`${interaction.user.id}:${brainrotFromPage.id}`);

            profile.onSale = profile.onSale.filter(brainrotId => brainrotId != brainrotFromPage.id);
            profile.brainrots = addBrainrot(brainrotFromPage.id, profile.brainrots);

            await profiles.set(interaction.user.id, profile);

            return interaction.write({
                content: `🛒 Brianrot **${brainrotFromPage.name}** ha sido retirado de la venta`,
                flags: MessageFlags.Ephemeral
            });
        });
    }
}