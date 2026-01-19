import { Declare, SubCommand, type CommandContext, IgnoreCommand, Options, createStringOption, AutocompleteInteraction, Embed, Button, ActionRow } from 'seyfert';
import Database from '../../systems/Database/database';
import { Brainrot, Profile, Shop, RarityMap, rarities } from '../../systems/Database/interfaces';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';
import { addBrainrot } from '../../systems/containers';
import { createProfile } from '../../systems/Database/createProfile';
import { CollectorInteraction } from 'seyfert/lib/components/handler';

const options = {
    enable: createStringOption({
        description: 'Brainrot a comprar',
        autocomplete: async (interaction: AutocompleteInteraction) => {
            const shopDB = Database.getInstance('shop');
            const brainrotsDB = Database.getInstance('brainrots');

            const entries = await shopDB.values();
            if (!entries.length) return;

            const results = await Promise.all(
                entries.map(async (shop: Shop) => {
                    const brainrot = await brainrotsDB.get(shop.brainrotId) as Brainrot;
                    return {
                        name: `${brainrot.name} · ${shop.price}<:braincoin:1454101560903598307>`,
                        value: `${shop.authorId}:${shop.brainrotId}`
                    };
                })
            );

            interaction.respond(results.slice(0, 25));
        },
        required: true
    }),
    rarity: createStringOption({
        description: 'Filtrar por rareza',
        choices: Object.keys(RarityMap).map(r => (
            {
                name: RarityMap[r as rarities].translation,
                value: r
            }
        ))
    })
} as const;

@Declare({
    name: 'buy',
    description: 'Compra un Brainrot de la tienda',
    integrationTypes: [ 'GuildInstall' ],
    ignore: IgnoreCommand.Message
})

@Options(options)

export default class BuyShopCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.options.brainrot.includes(':')) return ctx.write({ content: 'Selección inválida.' });

        const [ sellerId, brainrotId ] = ctx.options.brainrot.split(':');

        if (sellerId === ctx.author.id) return ctx.write({
            content: 'No puedes comprarte a ti mismo.',
            flags: MessageFlags.Ephemeral
        });

        const profiles = Database.getInstance('profiles');
        const shop = Database.getInstance('shop');
        const brainrots = Database.getInstance('brainrots');

        if (!await shop.has(`${sellerId}:${brainrotId}`)) return ctx.write({ content: 'Este Brainrot ya no está en venta.' });

        const shopItem: Shop = await shop.get(`${sellerId}:${brainrotId}`);
        const brainrot: Brainrot = await brainrots.get(brainrotId);

        let profile: Profile;
        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        const seller: Profile = await profiles.get(sellerId);

        if (profile.money < shopItem.price) return ctx.write({
            content: 'No tienes suficientes BrainCoins.',
            flags: MessageFlags.Ephemeral
        });

        const message = await ctx.write({
            embeds: [
                new Embed()
                    .setTitle(`🛒 Comprar ${brainrot.name}`)
                    .setColor(process.env.SECONDARY as ColorResolvable)
                    .setDescription(`**${brainrot.name}** ${RarityMap[brainrot.rarity].emoji}\n\n💰 Precio: **${shopItem.price}**<:braincoin:1454101560903598307>\n👤 Vendedor: <@${sellerId}>`
                )
            ],
            components: [
                new ActionRow().addComponents(
                    new Button().setCustomId('confirm').setLabel('Comprar').setStyle(ButtonStyle.Success),
                    new Button().setCustomId('cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
                )
            ]
        }, true);

        const collector = message.createComponentCollector({
            filter: i => i.user.id === ctx.author.id,
            timeout: 30000
        });

        collector.run('confirm', async (i: CollectorInteraction) => {
            collector.stop();

            if (!await shop.has(`${sellerId}:${brainrotId}`)) return i.update({ content: 'Este Brainrot ya no está disponible.', components: [] });

            profile.money -= shopItem.price;
            seller.money += shopItem.price;
            profile.brainrots = addBrainrot(brainrotId, profile.brainrots);
            seller.onSale = seller.onSale.filter(id => id !== brainrotId);

            await shop.delete(`${sellerId}:${brainrotId}`);
            await profiles.set(ctx.author.id, profile);
            await profiles.set(sellerId, seller);

            await i.update({
                content: `✅ Has comprado **${brainrot.name}** por **${shopItem.price}**<:braincoin:1454101560903598307>`,
                components: []
            });
        });

        collector.run('cancel', async (i: CollectorInteraction) => {
            collector.stop();
            await i.update({ content: 'Compra cancelada.', components: [] });
        });
    }
}
