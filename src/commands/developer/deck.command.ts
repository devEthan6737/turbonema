import { Declare, Options, Command, type CommandContext, IgnoreCommand, createStringOption, Middlewares, Embed, Button, AttachmentBuilder } from 'seyfert';
import { Brainrot, Deck, raritiesArray } from '../../systems/Database/interfaces';
import Database from '../../systems/Database/database';
import { Paginator } from '../../systems/messages/Paginator';
import { ColorResolvable } from 'seyfert/lib/common';
import { generateDeckImage } from '../../systems/canvas';

const options = {
    action: createStringOption({
        description: 'Selecciona una acción para gestionar los mazos',
        choices: [
            {
                name: 'add',
                value: 'add'
            },
            {
                name: 'list',
                value: 'list'
            }
        ],
        required: true
    })
} as const;

@Declare({
    name: "deck",
    description: "Gestiona los mazos de la base de datos del bot",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class DeckCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {

        if (ctx.options.action === 'add') {

            const deck: any = {}

            let step = 0; // 0 de 6
            const message = await ctx.write({
                content: `Escribe el nombre del Mazo.`
            }, true);

            ctx.client.collectors.create({
                event: 'MESSAGE_CREATE',
                filter: (arg) => arg.author.id === ctx.author.id,
                run: async (arg, stop): Promise<any> => {
                    if (arg.content === 'parar' || arg.content === 'stop') {
                        arg.write({
                            content: 'Creación detenida.'
                        });
                        stop();
                    } else if (arg.content === 'guardar' || arg.content === 'save') {
                        if (step != 6) return arg.write({ content: 'Debes completar todos los pasos para hacer el guardado.' });

                        const newDeckInterface: Deck = {
                            id: deck.id,
                            name: deck.name,
                            cardIds: deck.cardIds,
                            rarity: deck.rarity,
                            reward: deck.reward
                        };

                        const decks = Database.getInstance('decks');
                        decks.set(newDeckInterface.id, newDeckInterface);

                        const brainrots = Database.getInstance('brainrots');
                        let userBrainrots = await Promise.all(
                            newDeckInterface.cardIds.map(async (b) => {
                                const info = await brainrots.get(b) as Brainrot;
                                return { ...info };
                            })
                        );

                        const canvas = await generateDeckImage([], userBrainrots.map(brainrot => { return { name: brainrot.name, img: brainrot.base64Image } }), newDeckInterface.rarity);

                        arg.write({
                            content: `# Nuevo mazo creado\n**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}\nXP: ${deck.reward.xp}`,
                            files: [
                                new AttachmentBuilder().setName('brainrot.png').setFile('buffer', canvas!)
                            ]
                        });

                        stop();
                    } else if (step == 0) {
                        deck.id = crypto.randomUUID();
                        deck.name = arg.content;
                        step++;

                        message.edit({
                            content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}`
                        });
                        arg.write({ content: 'Escribe el ID de un brainrot que desea agregar. Cuando haya acabado de agregar brainrots al mazo, escriba `next`. Máximo de brainrots en un mazo: 9, mínimo: 1' });
                    } else if (step == 1) {
                        if (arg.content === 'next') {
                            if (!deck.cardIds || deck.cardIds.length < 1) return arg.write({ content: 'Un mazo deberá tener mínimo una carta para completarse.' });

                            step++;
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\``
                            });

                            arg.write({ content: 'Escribe la recompensa monetaria del mazo. Si no habrá, escriba `next`' });
                        } else {
                            if (deck.cardIds && deck.cardIds.length >= 9) return arg.write({ content: 'Máximo 9 cartas en un mazo, escriba `next`.' });
                            
                            const brainrots = Database.getInstance('brainrots');
                            if (!await brainrots.has(arg.content)) return arg.write({ content: 'No encuentro ese brainrot. Escriba la ID de un brainrot para agregarlo.' });
                            
                            if (!deck.cardIds) deck.cardIds = [];
                            deck.cardIds.push(arg.content);
                            
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\``
                            });
                            arg.write({ content: 'Brainrot agregado al mazo. Cantidad: ' + deck.cardIds.length });
                        }
                    } else if (step == 2) {
                        deck.reward = {};

                        if (arg.content == 'next') {
                            step++;
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}`
                            });
                            arg.write({ content: 'Escribe la recompensa de créditos del mazo. Si no habrá, escriba `next`' });
                        } else {
                            step++;

                            deck.reward.money = parseInt(arg.content);

                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}`
                            });
                            arg.write({ content: 'Escribe la recompensa de créditos del mazo. Si no habrá, escriba `next`' });
                        }
                    } else if (step == 3) {
                        if (arg.content == 'next') {
                            step++;
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}`
                            });
                            arg.write({ content: 'Si habrá una recompensa de carta al completar el mazo, escriba su ID. Si no habrá, escriba `next`' });
                        } else {
                            step++;

                            deck.reward.credits = parseInt(arg.content);

                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}`
                            });
                            arg.write({ content: 'Si habrá una recompensa de carta al completar el mazo, escriba su ID. Si no habrá, escriba `next`' });
                        }
                    } else if (step == 4) {
                        if (arg.content == 'next') {
                            step++;
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}`
                            });
                            arg.write({ content: 'Si habrá una recompensa de XP al completar el mazo, escribalo. Si no habrá, escriba `next`' });
                        } else {
                            step++;

                            deck.reward.exclusiveCardId = arg.content;

                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}`
                            });
                            arg.write({ content: 'Si habrá una recompensa de XP al completar el mazo, escribalo. Si no habrá, escriba `next`' });
                        }
                    } else if (step == 5) {
                        if (arg.content == 'next') {
                            step++;
                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}\nXP: ${deck.reward.xp}`
                            });
                            arg.write({ content: `Escribe la rareza del Brainrot.\nRarezas disponibles: \`${raritiesArray.join(' | ')}\`` });
                        } else {
                            step++;

                            deck.reward.xp = parseInt(arg.content);

                            message.edit({
                                content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}\nXP: ${deck.reward.xp}`
                            });
                            arg.write({ content: `Escribe la rareza del Brainrot.\nRarezas disponibles: \`${raritiesArray.join(' | ')}\`` });
                        }
                    } else if (step == 6) {
                        if (!raritiesArray.includes(arg.content as any)) return arg.write({ content: `No existe esa rareza.\nRarezas disponibles: \`${raritiesArray.join(' | ')}\`` });

                        deck.rarity = arg.content;

                        message.edit({
                            content: `**DeckId:** ${deck.id}\n**Nombre:** ${deck.name}\n**Brainrots agregados al mazo:**\n\`\`\`\n${deck.cardIds.join('\n')}\`\`\`\nBraincoins: ${deck.reward.money}\nAuracoins: ${deck.reward.credits}\nCarta: ${deck.reward.exclusiveCardId}\nXP: ${deck.reward.xp}\nRareza: ${deck.rarity}`
                        });
                        arg.write({ content: 'Ha terminado la configuración del mazo, para guardar escriba `save` o `guardar`' });
                    }
                }
            });

        } else if (ctx.options.action === 'list') {
            const decks = Database.getInstance('decks');
            const allDecks = await decks.all();
            const itemsPerPage = 4;
            const paginator = new Paginator(ctx, {
                data: allDecks.map(deck => deck.value),
                itemsPerPage,
                formatter: (currentItems: Deck[], currentPage: number): string => {
                    const start = currentPage * itemsPerPage;
                    return currentItems.map((deck: Deck, index) => {
                        const itemNumber = start + index + 1;
                        const padding = ' '.repeat(3 - String(itemNumber).length);
                        return `\`${padding}${itemNumber}\` **${deck.name}**. Cartas: ${deck.cardIds.length}. Rareza: ${deck.rarity}\n**ID :: \`${deck.id}\`**`;
                    }).join('\n');
                },
                embedGenerator: (currentPage: number, totalPages: number): Embed => {
                    return new Embed()
                        .setAuthor({
                            name: `Brainrots existentes`,
                            iconUrl: ctx.client.me.avatarURL()
                        })
                        .setColor(process.env.PRIMARY as ColorResolvable)
                        .setFooter({
                            text: `Página ${currentPage}/${totalPages}  ${allDecks.length} mazos en total`,
                            iconUrl: ctx.author.avatarURL()
                        });
                },
                middleComponent: new Button().setCustomId('sort').setLabel('⚙️').setStyle(1).setDisabled(true)
            });

            await paginator.start();
        }
    }
}