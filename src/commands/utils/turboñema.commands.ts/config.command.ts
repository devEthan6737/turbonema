import { Declare, SubCommand, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, Section, Button, ActionRow, Modal, Label, StringSelectMenu, StringSelectOption, ModalSubmitInteraction, ChannelSelectMenu, TextInput } from 'seyfert';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, ChannelType, MessageFlags, TextInputStyle } from 'seyfert/lib/types';
import Database from '../../../systems/Database/database';
import { Guild } from '../../../systems/Database/interfaces';
import { createNumericalProgressBar } from '../../../systems/utils';
import { MessageInstanceCallback } from '../../../systems/messages/MessageInstance';
import { CollectorInteraction } from 'seyfert/lib/components/handler';

@Declare({
    name: 'config',
    description: 'Configura a turboñema',
    integrationTypes: [ 'GuildInstall' ],
    ignore: IgnoreCommand.Message,
    botPermissions: [ 'AddReactions', 'SendMessages', 'ViewChannel' ],
    defaultMemberPermissions: [ 'Administrator' ]
})

export default class AlgorithmConfigCommand extends SubCommand {
    async run(ctx: CommandContext) {
        const guilds = Database.getInstance('guilds');
        
        let guild: Guild;
        if (!await guilds.has(ctx.guildId ?? '')) {
            guild = {
                id: ctx.guildId ?? '',
                turboñema: {
                    enabled: false,
                    integrationType: 'global',
                    replyChance: 'always',
                    channelId: undefined,
                    messageLimit: 10,
                    train: {
                        min: 0,
                        max: 1000,
                        enabled: false
                    }
                }
            };

            await guilds.set(ctx.guildId ?? '', guild);
        } else guild = await guilds.get(ctx.guildId ?? '');

        const MessageInstance = new MessageInstanceCallback(async (guild: Guild) => {
            return {
                components: [
                    new Container().setColor((guild.turboñema.enabled? process.env.SUCCESS : process.env.DANGER) as ColorResolvable).addComponents(
                        new TextDisplay().setContent(`# Turboñema V1`),
                        new Separator(),
                        new Section()
                            .setComponents(
                                new TextDisplay().setContent(`**\`Algoritmo ${guild.turboñema.enabled? 'ACTIVADO' : 'DESACTIVADO'}\`**`)
                            )
                            .setAccessory(
                                new Button().setCustomId('toggle').setLabel(guild.turboñema.enabled? 'Desactivar' : 'Activar').setStyle(guild.turboñema.enabled? ButtonStyle.Danger : ButtonStyle.Success)
                            ),
                        new Separator(),
                        new TextDisplay().setContent(
                            `- **Integración ::** \`${guild.turboñema.integrationType === 'category'? 'Por categoría' : guild.turboñema.integrationType === 'channel'? 'Por canal' : 'Global'}\`\n` +
                            (guild.turboñema.channelId && guild.turboñema.integrationType != 'global'? `- **${guild.turboñema.integrationType === 'category'? `En la categoría ::** \`${guild.turboñema.channelId}\`` : `En el canal ::** <#${guild.turboñema.channelId}>`}\n` : '') +
                            `- **Actividad ::** \`${guild.turboñema.replyChance === 'always'? 'Siempre responde' : guild.turboñema.replyChance === 'frequently' ? 'Responde frecuentemente' : guild.turboñema.replyChance === 'ocassionally'? 'Respuesta ocasional' : 'Usuario inactivo'}\`\n` +
                            `- **Límite de mensajes ::** **\`${guild.turboñema.messageLimit}\`** ${createNumericalProgressBar(15, guild.turboñema.messageLimit, 15).bar} **\`15\`**`
                        ),
                        new ActionRow().setComponents(
                            new Button().setCustomId('integration').setLabel('Integración').setStyle(ButtonStyle.Secondary),
                            new Button().setCustomId('channel').setLabel(guild.turboñema.integrationType === 'category'? 'Categoría' : 'Canal').setStyle(ButtonStyle.Secondary).setDisabled(guild.turboñema.integrationType === 'global'),
                            new Button().setCustomId('reply').setLabel('Actividad').setStyle(ButtonStyle.Secondary),
                            new Button().setCustomId('limit').setLabel('Límite').setStyle(ButtonStyle.Secondary)
                        ),
                        new Separator(),
                        new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                    )
                ],
                flags: MessageFlags.IsComponentsV2
            };
        });

        const message = await ctx.write(await MessageInstance.resolve(guild), true);

        const collector = message.createComponentCollector({
            filter: (i) => ctx.author.id === i.user.id,
        });

        collector.run('toggle', async (interaction: CollectorInteraction) => {
            await interaction.deferUpdate();

            guild.turboñema.enabled = !guild.turboñema.enabled;

            await guilds.set(ctx.guildId ?? '', guild);

            await interaction.editResponse(await MessageInstance.resolve(guild));
        });

        collector.run('integration', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Seleccionar tipo de integración`)
                    .addComponents([
                        new Label()
                            .setLabel('Seleccionar tipo de integración')
                            .setComponent(
                                new StringSelectMenu()
                                    .setCustomId('integration')
                                    .setOptions([
                                        new StringSelectOption().setLabel('Global').setValue('global').setDescription(`Se responde en todos los canales`),
                                        new StringSelectOption().setLabel('Categoría').setValue('category').setDescription(`Se responde en una categoría`),
                                        new StringSelectOption().setLabel('Canal (Recomendado)').setValue('channel').setDescription(`Se responde en un único canal`)
                                    ])
                                    .setRequired(true)
                            )
                    ])
                    .run(integrationModalReply)
            );
        });

        collector.run('channel', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Seleccionar ${guild.turboñema.integrationType === 'category'? 'categoría' : 'canal'}`)
                    .addComponents([
                        new Label()
                            .setLabel(`Seleccionar ${guild.turboñema.integrationType === 'category'? 'categoría' : 'canal'}`)
                            .setComponent(
                                new ChannelSelectMenu()
                                    .setCustomId('channel')
                                    .setChannelTypes(
                                        guild.turboñema.integrationType === 'category' ?
                                            [ ChannelType.GuildCategory ]
                                        : guild.turboñema.integrationType === 'channel' ?
                                            [ ChannelType.GuildText ]
                                        : [ ChannelType.GuildText, ChannelType.GuildCategory ]
                                    )
                            )
                    ])
                    .run(channelModalReply)
            );
        });

        collector.run('reply', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Seleccionar tipo de respuesta`)
                    .addComponents([
                        new Label()
                            .setLabel('Seleccionar tipo de respuesta')
                            .setComponent(
                                new StringSelectMenu()
                                    .setCustomId('reply')
                                    .setOptions([
                                        new StringSelectOption().setLabel('Usuario inactivo (Recomendado)').setValue('idleuser').setDescription(`2% de umbral`),
                                        new StringSelectOption().setLabel('A veces').setValue('ocassionally').setDescription(`5% de umbral`),
                                        new StringSelectOption().setLabel('Frecuentemente').setValue('frequently').setDescription(`13% de umbral`),
                                        new StringSelectOption().setLabel('Siempre').setValue('always').setDescription(`100% de umbral`)
                                    ])
                                    .setRequired(true)
                            )
                    ])
                    .run(replyModalReply)
            );
        });

        collector.run('limit', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Seleccionar límite`)
                    .addComponents([
                        new Label()
                            .setLabel('Límite')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('limit')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                    ])
                    .run(limitModalReply)
            );
        });

        async function integrationModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.values;
            if (value) {
                guild.turboñema.integrationType = value[0] as Guild['turboñema']['integrationType'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }

        async function channelModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.values;
            if (value) {
                guild.turboñema.channelId = value[0] as Guild['turboñema']['channelId'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }

        async function replyModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.values;
            if (value) {
                guild.turboñema.replyChance = value[0] as Guild['turboñema']['replyChance'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }

        async function limitModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.value;
            if (value && !isNaN(parseInt(value))) {
                guild.turboñema.messageLimit = parseInt(value) > 15? 15 : parseInt(value) < 2? 2 : parseInt(value) as Guild['turboñema']['messageLimit'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }
    }
}
