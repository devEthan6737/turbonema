import { Declare, Command, type CommandContext, IgnoreCommand, Options, createUserOption, ActionRow, Button, Container, TextDisplay, Separator, Modal, Label, StringSelectMenu, StringSelectOption, ModalSubmitInteraction, TextInput } from 'seyfert';
import { ColorResolvable } from 'seyfert/lib/common';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { ButtonStyle, MessageFlags, TextInputStyle } from 'seyfert/lib/types';
import Database from '../../systems/Database/database';
import { Profile, Brainrot, RarityMap } from '../../systems/Database/interfaces';
import { addBrainrot, removeBrainrot } from '../../systems/containers';

const options = {
    member: createUserOption({
        description: 'Usuario con el que tradear',
        required: true
    })
} as const;

@Declare({
    name: "trade",
    description: "Intercambia brainrots con otro usuario",
    ignore: IgnoreCommand.Message
})

@Options(options)

export default class TradeCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const target = ctx.options.member;
        if (target.id === ctx.author.id || target.id === ctx.client.me.id) return ctx.write({ content: "bro xd" });

        const profiles = Database.getInstance('profiles');
        const brainrots = Database.getInstance('brainrots');

        let offers = {
            [ctx.author.id]: [] as Brainrot[],
            [target.id]: [] as Brainrot[],
            [`${ctx.author.id}:money`]: 0 as Profile['money'],
            [`${target.id}:money`]: 0 as Profile['money']
        };

        const renderTrade = async () => {
            const authorOffers = {
                brainrots: offers[ctx.author.id] as Brainrot[],
                money: offers[`${ctx.author.id}:money`] as Profile['money']
            }
            const targetOffers = {
                brainrots: offers[target.id] as Brainrot[],
                money: offers[`${target.id}:money`] as Profile['money']
            }

            const container = new Container().setColor(process.env.SECONDARY as ColorResolvable).addComponents(
                new TextDisplay().setContent('# <:trato:1454876066308161785> Intercambio de brainrots <:trato:1454876066308161785>'),
                new Separator(),
                new TextDisplay().setContent(`## <:flecha:1454630283977429157> Oferta de ${ctx.author.username}`),
            );

            if (authorOffers.money > 0) {
                container.addComponents(
                    new TextDisplay().setContent(`- \` OFRECE MONEDAS \` **:: ${authorOffers.money}**<:braincoin:1454101560903598307>`)
                )
            }

            container.addComponents(
                new TextDisplay().setContent(authorOffers.brainrots.length > 0? authorOffers.brainrots.map((brainrot, index) => `\` ${index + 1} \` **${brainrot.name} \`${RarityMap[brainrot.rarity].emoji} ${RarityMap[brainrot.rarity].translation}\`**`).join('\n') : '`Sin Brainrots en oferta`'),
                new Separator(),
                new TextDisplay().setContent(`## <:flecha:1454630283977429157> Oferta de ${target.username}`),
            );

            if (targetOffers.money > 0) {
                container.addComponents(
                    new TextDisplay().setContent(`- \` OFRECE MONEDAS \` **:: ${targetOffers.money}**<:braincoin:1454101560903598307>`)
                )
            }

            container.addComponents(
                new TextDisplay().setContent(targetOffers.brainrots.length > 0? targetOffers.brainrots.map((brainrot, index) => `\` ${index + 1} \` **${brainrot.name} \`${RarityMap[brainrot.rarity].emoji} ${RarityMap[brainrot.rarity].translation}\`**`).join('\n') : '`Sin Brainrots en oferta`')
            );

            return {
                components: [
                    container,
                    new ActionRow().addComponents(
                        new Button().setCustomId('add').setEmoji('<:agregarcarpeta:1454876358504349879>').setLabel('Añadir Brainrot').setStyle(ButtonStyle.Success),
                        new Button().setCustomId('clear').setEmoji('<:limpiar:1454876540226502772>').setLabel('Limpiar mi oferta').setStyle(ButtonStyle.Danger),
                        new Button().setCustomId('confirm').setEmoji('<:comprobar:1454876797572350064>').setLabel('Aceptar Intercambio').setStyle(ButtonStyle.Primary).setDisabled(authorOffers.brainrots.length === 0 && targetOffers.brainrots.length === 0 && authorOffers.money == 0 && targetOffers.money == 0)
                    )
                ],
                flags: MessageFlags.IsComponentsV2
            };
        };

        const message = await ctx.write(await renderTrade(), true);

        const collector = message.createComponentCollector({
            filter: (i) => [ ctx.author.id, target.id ].includes(i.user.id),
        });

        collector.run('add', async (interaction: CollectorInteraction) => {
            const userProfile: Profile = await profiles.get(interaction.user.id);
            if (!userProfile.brainrots.length) return interaction.write({ content: "No tienes nada que ofrecer", flags: MessageFlags.Ephemeral });

            const userBrainrots = await Promise.all(
                userProfile.brainrots.map(async (b) => {
                    const info = await brainrots.get(b.id) as Brainrot;
                    return { ...info, amount: b.amount, protectedUntil: b.protectedUntil };
                })
            );

            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Ofrecer un Brainrot`)
                    .addComponents([
                        new TextDisplay()
                            .setId(1)
                            .setContent(`:warning: Al ofrecer un Brainrot, el otro usuario puede reclamarlo al instante`),
                        new Label()
                            .setLabel('Elegir Brainrot')
                            .setComponent(
                                new StringSelectMenu()
                                    .setCustomId('brainrot')
                                    .setOptions(
                                        userBrainrots.map(brainrot => new StringSelectOption().setLabel(brainrot.name).setValue(brainrot.id).setDescription(`Nivel :: ${brainrot.levelRequeried} | Precio :: ${brainrot.buyPrice}`))
                                    )
                                    .setRequired(false)
                            ),
                        new Label()
                            .setLabel('Agregar monedas (opcional)')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('money')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                            )
                    ])
                    .run(modalReply)
            );
        });

        collector.run('clear', async (interaction: CollectorInteraction) => {
            offers[interaction.user.id] = [];
            offers[`${interaction.user.id}:money`] = 0;

            await interaction.update(await renderTrade());
        });

        collector.run('confirm', async (i) => {
            collector.stop();

            const partnerId = i.user.id === ctx.author.id ? target.id : ctx.author.id;
            const senderProfile: Profile = await profiles.get(i.user.id);
            const receiverProfile: Profile = await profiles.get(partnerId);

            for (const brainrot of offers[i.user.id] as Brainrot[]) {
                senderProfile.brainrots = removeBrainrot(brainrot.id, senderProfile.brainrots);
                receiverProfile.brainrots = addBrainrot(brainrot.id, receiverProfile.brainrots);
            }

            for (const brainrot of offers[partnerId] as Brainrot[]) {
                receiverProfile.brainrots = removeBrainrot(brainrot.id, receiverProfile.brainrots);
                senderProfile.brainrots = addBrainrot(brainrot.id, senderProfile.brainrots);
            }

            if (offers[`${i.user.id}:money`] as number > 0) {
                receiverProfile.money += offers[`${i.user.id}:money`] as number;
                senderProfile.money -= offers[`${i.user.id}:money`] as number;
            }

            if (offers[`${partnerId}:money`] as number > 0) {
                senderProfile.money += offers[`${partnerId}:money`] as number;
                receiverProfile.money -= offers[`${partnerId}:money`] as number;
            }

            await profiles.set(i.user.id, senderProfile);
            await profiles.set(partnerId, receiverProfile);

            const authorOffers = {
                brainrots: offers[ctx.author.id] as Brainrot[],
                money: offers[`${ctx.author.id}:money`] as Profile['money']
            }
            const targetOffers = {
                brainrots: offers[target.id] as Brainrot[],
                money: offers[`${target.id}:money`] as Profile['money']
            }

            await i.update({
                components: [
                    new Container()
                        .setColor(process.env.SECONDARY as ColorResolvable)
                        .addComponents(
                            new TextDisplay().setContent('# <:trato:1454876066308161785> Intercambio de brainrots <:trato:1454876066308161785>'),
                            new Separator(),
                            new TextDisplay().setContent(`## <:flecha:1454630283977429157> Oferta de ${ctx.author.username}`),
                            new TextDisplay().setContent(`- \` MONEDAS OFERTADAS \`: **${authorOffers.money}**<:braincoin:1454101560903598307>`),
                            new TextDisplay().setContent(authorOffers.brainrots.length > 0? authorOffers.brainrots.map((brainrot) => `\` OFERTADO \` **${brainrot.name} \`${RarityMap[brainrot.rarity].emoji} ${RarityMap[brainrot.rarity].translation}\`**`).join('\n') : '`Sin Brainrots en oferta`'),
                            new Separator(),
                            new TextDisplay().setContent(`## <:flecha:1454630283977429157> Oferta de ${target.username}`),
                            new TextDisplay().setContent(`- \` MONEDAS OFERTADAS \`: **${targetOffers.money}**<:braincoin:1454101560903598307>`),
                            new TextDisplay().setContent(targetOffers.brainrots.length > 0? targetOffers.brainrots.map((brainrot) => `\` OFERTADO \` **${brainrot.name} \`${RarityMap[brainrot.rarity].emoji} ${RarityMap[brainrot.rarity].translation}\`**`).join('\n') : '`Sin Brainrots en oferta`')
                        ),
                ]
            });
        });

        async function modalReply (interaction: ModalSubmitInteraction) {
            if (interaction.data.components[1].component.values && interaction.data.components[1].component.values.length > 0) {
                const brainrot = await brainrots.get(interaction.data.components[1].component.values[0]);

                (offers[interaction.user.id] as Brainrot[]).push(brainrot);
            }

            if (interaction.data.components[2].component.value) {
                const money = parseInt(interaction.data.components[2].component.value);

                const userProfile: Profile = await profiles.get(interaction.user.id);
                if (!isNaN(money) && money >= 0 && money <= userProfile.money) (offers[`${interaction.user.id}:money`] as number) += money;
            }

            interaction.update(await renderTrade());
        }
    }
}