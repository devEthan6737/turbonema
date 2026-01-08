import { Declare, Command, type CommandContext, IgnoreCommand, Embed, Button, ActionRow, AttachmentBuilder, GuildCommandContext, Modal, TextDisplay, ModalSubmitInteraction, Label, TextInput } from 'seyfert';
import Database from '../../systems/Database/database';
import { Brainrot, Profile, rarities, RarityMap } from '../../systems/Database/interfaces';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags, TextInputStyle } from 'seyfert/lib/types';
import { createProfile } from '../../systems/Database/createProfile';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { playLocalAudio } from '../../voice/playLocalAudio';
import { findBrainrot, removeBrainrot } from '../../systems/containers';
import ms from 'ms';

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
        let userBrainrots = await Promise.all(
            profile.brainrots.map(async (b) => {
                const info = await brainrots.get(b.id) as Brainrot;
                return { ...info, amount: b.amount, protectedUntil: b.protectedUntil };
            })
        );

        let currentPage = 0;
        const totalPages = userBrainrots.length;

        const getMessagePayload = async (page: number): Promise<ContextWriteOptions> => {
            const brainrot = userBrainrots[page];

            const ButtonsActionRow = new ActionRow().addComponents(
                new Button().setCustomId('protect').setEmoji('🛡️').setStyle(ButtonStyle.Primary).setLabel(brainrot.protectedUntil && brainrot.protectedUntil - Date.now() > 0 && brainrot.protectedUntil - Date.now() <= ms('5d') ? 'Proteger con antelación' : 'Proteger').setDisabled(brainrot.protectedUntil && brainrot.protectedUntil - Date.now() > ms('5d')? true : false),
                new Button().setCustomId('scrap').setLabel('Desechar').setEmoji('<:braincoin:1454101560903598307>').setStyle(ButtonStyle.Danger),
                new Button().setCustomId('sell').setEmoji('<:braincoin:1454101560903598307>').setStyle(ButtonStyle.Success).setLabel('Vender').setDisabled(brainrot.protectedUntil && brainrot.protectedUntil > Date.now()? true : false)
            );

            const voice = await ctx.member?.voice().catch(() => null);
            if (voice && voice.channelId) ButtonsActionRow.addComponents(
                new Button().setCustomId('reproduce').setLabel('Reproducir').setEmoji('<:reproducir:1454196963632353484>').setStyle(ButtonStyle.Success)
            );

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
                        new Button().setCustomId('page').setLabel(`${page + 1}/${totalPages}`).setStyle(ButtonStyle.Secondary),
                        new Button().setCustomId('next').setLabel('↣').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                    ),
                    ButtonsActionRow
                ],
                files: [
                    new AttachmentBuilder().setName('brainrot.png').setFile('buffer', Buffer.from(brainrot.base64Image, "base64"))
                ]
            };
        };

        const message = await ctx.write(await getMessagePayload(currentPage), true);

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

            await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);
        });

        collector.run('page', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Moverse de página`)
                    .addComponents([
                        new Label()
                            .setLabel('¿A qué página quieres ir?')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('page')
                                    .setStyle(TextInputStyle.Short)
                                    .setLength({
                                        min: 1,
                                        max: totalPages.toString().length
                                    })
                            )
                    ])
                    .run(pageModal)
            );
        });

        collector.run('reproduce', async (interaction: CollectorInteraction) => {
            const voice = await ctx.member?.voice().catch(() => null);
            if (!voice || !voice.channelId) return interaction.write({ content: '¡Debes estar en un canal de voz para reproducir esto!', flags: MessageFlags.Ephemeral });

            interaction.write({ content: 'Reproduciendo audio.', flags: MessageFlags.Ephemeral });
            playLocalAudio(ctx as GuildCommandContext, userBrainrots[currentPage].audioFileName);
        });

        collector.run('scrap', async (interaction: CollectorInteraction) => {
            profile.money += userBrainrots[currentPage].scrapValue;
            profile.brainrots = removeBrainrot(userBrainrots[currentPage].id, profile.brainrots);
            await profiles.set(ctx.author.id, profile);

            userBrainrots = await Promise.all(
                profile.brainrots.map(async (b) => {
                    const info = await brainrots.get(b.id) as Brainrot;
                    return { ...info, amount: b.amount, protectedUntil: b.protectedUntil };
                })
            );

            await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);
        });

        collector.run('protect', async (interaction: CollectorInteraction) => {
            const brainrot = userBrainrots[currentPage];
            const price = brainrot.amount * brainrot.buyPrice * brainrot.levelRequeried;

            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Proteger ${brainrot.name}`)
                    .addComponents([
                        new TextDisplay()
                            .setId(1)
                            .setContent(`<:flecha:1454630283977429157> Proteger tu${brainrot.amount > 1? `s ${brainrot.amount}` : ''} **${brainrot.name}** costará **${price}**<:braincoin:1454101560903598307>\n<:flecha:1454630283977429157> Nadie podrá robarlo mientras esté protegido\n<:flecha:1454630283977429157> La protección durará **30 días**\n<:flecha:1454630283977429157> Se podrá renovar la protección 5 días antes por **${price * 1.50}**<:braincoin:1454101560903598307>\n<:flecha:1454630283977429157> No se emitirá el estado de la protección\n<:flecha:1454630283977429157> No se podrá vender hasta el fin del estado\n\nSi está de acuerdo, pulse el botón **enviar**`)
                    ])
                    .run(modalReply)
            );
        });

        collector.run('sell', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Vender ${userBrainrots[currentPage].name}`)
                    .addComponents([
                        new TextDisplay()
                            .setId(1)
                            .setContent(`<:flecha:1454630283977429157> Tu Brainrot estará a la venta hasta que sea retirado\n<:flecha:1454630283977429157> Solo podrás vender todo tu stack de Brainrots, solo uno\n<:flecha:1454630283977429157> Si tu stack de Brainrots está protegido, no se podrá vender\n<:flecha:1454630283977429157> Para que tu Brainrot se venda, dependes de que otra persona lo compre`),
                        new Label()
                            .setLabel('Selecciona el precio')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('price')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder(`${Math.round(userBrainrots[currentPage].buyPrice * 1.5)} (Recomendado)`)
                                    .setValue(`${Math.round(userBrainrots[currentPage].buyPrice * 1.5)}`)
                                    .setLength({
                                        min: 2,
                                        max: 8
                                    })
                            )
                    ])
                    .run(sellModal)
            );
        });

        async function modalReply (interaction: ModalSubmitInteraction) {
            profile = await profiles.get(interaction.user.id);

            const brainrotFromPage = userBrainrots[currentPage];
            const brainrot = findBrainrot(userBrainrots[currentPage].id, profile.brainrots);

            if (!brainrot) return interaction.write({
                content: 'No he encontrado el Brainrot en tu perfil.',
                flags: MessageFlags.Ephemeral
            });

            if (brainrot.protectedUntil && brainrot.protectedUntil - Date.now() > ms('5d')) return interaction.write({
                content: 'Tu Brainrot ya está protegido.',
                flags: MessageFlags.Ephemeral
            });

            const price = brainrotFromPage.amount * brainrotFromPage.buyPrice * brainrotFromPage.levelRequeried * (brainrot.protectedUntil && brainrot.protectedUntil - Date.now() > 0 && brainrot.protectedUntil - Date.now() <= ms('5d')? 1.50 : 1);
            if (profile.money - price < 0) return interaction.write({
                content: 'No tienes suficiente BrainCoins para proteger tu stack de Brainrots.',
                flags: MessageFlags.Ephemeral
            });

            profile.money -= price;

            if (brainrot.protectedUntil && brainrot.protectedUntil - Date.now() > 0) brainrot.protectedUntil = brainrot.protectedUntil + ms('30d');
            else brainrot.protectedUntil = Date.now() + ms('30d');

            await profiles.set(interaction.user.id, profile);

            interaction.write({
                content: `¡Has protegido tu stack de **${brainrotFromPage.name}**! 🛡\n\nTe ha costado **${price}**<:braincoin:1454101560903598307> protegerlo\n<:meme:1454112604267090112> Tu Brainrot estará protegido durante **30 días**`,
                flags: MessageFlags.Ephemeral
            });
        }

        async function sellModal(interaction: ModalSubmitInteraction) {
            const shops = Database.getInstance('shop');
            const priceInput = interaction.data.components[1].component.value;
            const price = Number(priceInput);

            if (!Number.isInteger(price) || price <= 0) return interaction.write({
                content: 'El precio debe ser un número entero positivo',
                flags: MessageFlags.Ephemeral
            });

            profile = await profiles.get(interaction.user.id);

            const brainrotFromPage = userBrainrots[currentPage];
            const brainrot = findBrainrot(brainrotFromPage.id, profile.brainrots);

            if (!brainrot) return interaction.write({
                content: 'Ya no tienes este Brainrot',
                flags: MessageFlags.Ephemeral
            });

            if (brainrot.protectedUntil && brainrot.protectedUntil > Date.now()) return interaction.write({
                content: '🛡️ No puedes vender un Brainrot protegido',
                flags: MessageFlags.Ephemeral
            });

            if (profile.onSale.includes(brainrot.id)) return interaction.write({
                content: 'Este Brainrot ya está a la venta',
                flags: MessageFlags.Ephemeral
            });

            const shopEntry = {
                authorId: interaction.user.id,
                brainrotId: brainrot.id,
                postDate: Date.now(),
                price
            };

            await shops.set(`${interaction.user.id}:${brainrot.id}`, shopEntry);

            profile.onSale ??= [];
            profile.onSale.push(brainrot.id);
            profile.brainrots = removeBrainrot(brainrot.id, profile.brainrots);

            await profiles.set(interaction.user.id, profile);

            return interaction.write({
                content: `🛒 **${brainrotFromPage.name}** puesto a la venta\n\n- Precio: **${price}**<:braincoin:1454101560903598307>\n\nPodrás retirarlo cuando quieras desde la tienda.`,
                flags: MessageFlags.Ephemeral
            });
        }

        async function pageModal(interaction: ModalSubmitInteraction) {
            const inputPage = interaction.data.components[0].component.value;
            const pageNumber = parseInt(inputPage ?? '0');

            if (isNaN(pageNumber)) return interaction.write({
                content: 'Debes ingresar un número válido.',
                flags: MessageFlags.Ephemeral
            });

            if (pageNumber < 1 || pageNumber > totalPages) return interaction.write({
                content: `❌ Página fuera de rango. Elige entre 1 y ${totalPages}.`,
                flags: MessageFlags.Ephemeral
            });

            currentPage = pageNumber - 1;

            await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);
        }
    }
}