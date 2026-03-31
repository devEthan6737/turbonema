import { Declare, SubCommand, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, Section, Button, ActionRow, Modal, Label, ModalSubmitInteraction, TextInput, MediaGallery, MediaGalleryItem } from 'seyfert';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags, TextInputStyle } from 'seyfert/lib/types';
import Database from '../../../systems/database/database';
import { Guild } from '../../../systems/database/interfaces';
import { createNumericalProgressBar } from '../../../systems/utils';
import { MessageInstanceCallback } from '../../../systems/messages/MessageInstance';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { Chart, registerables } from 'chart.js';
import { createCanvas } from '@napi-rs/canvas';
import MegaDB from '../../../systems/database/megadb_adapter';

Chart.register(...registerables);

@Declare({
    name: 'train',
    description: 'Configura el entrenamiento de turboñema',
    integrationTypes: [ 'GuildInstall' ],
    ignore: IgnoreCommand.Message,
    botPermissions: [ 'AddReactions', 'SendMessages', 'ViewChannel' ],
    defaultMemberPermissions: [ 'Administrator' ]
})

export default class AlgorithmTrainCommand extends SubCommand {
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
            const textChains = MegaDB.getInstance(ctx.guildId ?? '');
            const emojiChains = MegaDB.getInstance(`${ctx.guildId ?? ''}:emojis`);
            const gifChains = MegaDB.getInstance(`${ctx.guildId ?? ''}:gifs`);
            const chainsLenght = (textChains.has(ctx.guildId ?? '') ? Object.keys(textChains.get(ctx.guildId ?? '')).length : 0) + (emojiChains.has(`${ctx.guildId ?? ''}:emojis`) ? Object.keys(emojiChains.get(`${ctx.guildId ?? ''}:emojis`)).length : 0) + (gifChains.has(`${ctx.guildId ?? ''}:gifs`) ? Object.keys(gifChains.get(`${ctx.guildId ?? ''}:gifs`)).length : 0);
            const canvas = createCanvas(600, 400);
            const configuration = {
                type: 'doughnut' as const,
                data: {
                    labels: [ 'Memoria Libre', 'Memoria Usada' ],
                    datasets: [
                        {
                            label: 'Malla de aprendizaje',
                            data: [
                                Math.max(0, guild.turboñema.train.max - chainsLenght),
                                chainsLenght
                            ],
                            backgroundColor: [
                                process.env.SECONDARY,
                                process.env.PRIMARY

                            ],
                            borderColor: [
                                process.env.BLACK,
                                process.env.BLACK
                            ],
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    devicePixelRatio: 1,
                    plugins: {
                        legend: {
                            labels: {
                                color: "#b9d0d3",
                                font: {
                                    size: 14,
                                    weight: 'bold' as const
                                }
                            }
                        }
                    }
                },
                plugins: [
                    {
                        id: 'custom_canvas_background_color',
                        beforeDraw: (chart: any) => {
                            const { ctx } = chart;
                            ctx.save();
                            ctx.globalCompositeOperation = 'destination-over';
                            ctx.restore();
                        }
                    }
                ]
            };

            new Chart(canvas as unknown as any, configuration);

            return {
                files: [
                    {
                        filename: 'graphic.png',
                        data: canvas.toBuffer('image/png')
                    }
                ],
                components: [
                    new Container().setColor((guild.turboñema.train.enabled? process.env.SUCCESS : process.env.DANGER) as ColorResolvable).addComponents(
                        new TextDisplay().setContent(`# Entrenamiento de T-V1`),
                        new Separator(),
                        new Section()
                            .setComponents(
                                new TextDisplay().setContent(`**\`Entrenamiento ${guild.turboñema.train.enabled? 'ACTIVADO' : 'DESACTIVADO'}\`**`)
                            )
                            .setAccessory(
                                new Button().setCustomId('toggle').setLabel(guild.turboñema.train.enabled? 'Desactivar' : 'Activar').setStyle(guild.turboñema.train.enabled? ButtonStyle.Danger : ButtonStyle.Success)
                            ),
                        new Separator(),
                        new TextDisplay().setContent(
                            `### Aprendizaje de cadenas\n` +
                            `- **Mínimo  ::** \`${guild.turboñema.train.min}\`\n` +
                            `- **Máximo ::** \`${guild.turboñema.train.max}\`\n` +
                            `**\`${guild.turboñema.train.min}CHNS\`** ${createNumericalProgressBar(guild.turboñema.train.max, guild.turboñema.train.min, 24).bar} **\`${guild.turboñema.train.max}CHNS\`**`
                        ),
                        new ActionRow().setComponents(
                            new Button().setCustomId('min').setLabel('Mínimo').setStyle(ButtonStyle.Secondary),
                            new Button().setCustomId('max').setLabel('Máximo').setStyle(ButtonStyle.Secondary)
                        ),
                        new Separator(),
                        new TextDisplay().setContent(
                            `### Gráfico de la malla\n` +
                            `- **Malla requerida ::** **\`${chainsLenght > guild.turboñema.train.min? guild.turboñema.train.min : chainsLenght}CHNS\`** ${createNumericalProgressBar(guild.turboñema.train.min, chainsLenght > guild.turboñema.train.min? guild.turboñema.train.min : chainsLenght, 15).bar} **\`${guild.turboñema.train.min}CHNS\`**\n` +
                            `- **Cuota de malla   ::** **\`${chainsLenght}CHNS\`** ${createNumericalProgressBar(guild.turboñema.train.max, chainsLenght, 16).bar} **\`${guild.turboñema.train.max}CHNS\`**\n`
                        ),
                        new MediaGallery().setItems(
                            new MediaGalleryItem().setMedia(`attachment://graphic.png`)
                        ),
                        new ActionRow().setComponents(
                            new Button().setCustomId('delete').setLabel('Borrar aprendizaje').setStyle(ButtonStyle.Danger)
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

            guild.turboñema.train.enabled = !guild.turboñema.train.enabled;

            await guilds.set(ctx.guildId ?? '', guild);

            await interaction.editResponse(await MessageInstance.resolve(guild));
        });

        collector.run('min', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Establecer mínimo`)
                    .addComponents([
                        new Label()
                            .setLabel('Establecer mínimo')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('min')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                    ])
                    .run(minModalReply)
            );
        });

        collector.run('max', async (interaction: CollectorInteraction) => {
            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Establecer máximo`)
                    .addComponents([
                        new Label()
                            .setLabel('Establecer máximo')
                            .setComponent(
                                new TextInput()
                                    .setCustomId('max')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                    ])
                    .run(maxModalReply)
            );
        });

        collector.run('delete', async (interaction: CollectorInteraction) => {
            await interaction.deferUpdate();

            const textChains = MegaDB.getInstance(ctx.guildId ?? '');
            const emojiChains = MegaDB.getInstance(`${ctx.guildId ?? ''}:emojis`);
            const gifChains = MegaDB.getInstance(`${ctx.guildId ?? ''}:gifs`);

            textChains.delete(ctx.guildId ?? '');
            emojiChains.delete(`${ctx.guildId ?? ''}:emojis`);
            gifChains.delete(`${ctx.guildId ?? ''}:gifs`);

            await interaction.editResponse(await MessageInstance.resolve(guild));
        });

        async function minModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.value;
            if (value && !isNaN(parseInt(value))) {
                guild.turboñema.train.min = parseInt(value) > guild.turboñema.train.max? guild.turboñema.train.max : parseInt(value) < 0? 0 : parseInt(value) as Guild['turboñema']['train']['min'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }

        async function maxModalReply (interaction: ModalSubmitInteraction) {
            await interaction.deferUpdate();

            const value = interaction.data.components[0].component.value;
            if (value && !isNaN(parseInt(value))) {
                guild.turboñema.train.max = parseInt(value) > 1000? 1000 : parseInt(value) < guild.turboñema.train.min? guild.turboñema.train.min : parseInt(value) as Guild['turboñema']['train']['max'];
                await guilds.set(ctx.guildId ?? '', guild);
            }

            await interaction.editResponse(await MessageInstance.resolve(guild));
        }
    }
}
