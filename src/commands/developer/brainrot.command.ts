import { Declare, Options, Command, type CommandContext, IgnoreCommand, createStringOption, Middlewares, AttachmentBuilder, Embed, Button, MessageStructure } from 'seyfert';
import { Brainrot, Profile, rarities, raritiesArray } from '../../systems/Database/interfaces';
import path from 'node:path';
import fs from 'node:fs';
import Database from '../../systems/Database/database';
import { Paginator } from '../../systems/messages_utils/Paginator';
import { ColorResolvable } from 'seyfert/lib/common';
import { createBrainrotCard } from '../../systems/canvas';
import { addBrainrot } from '../../systems/containers';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

interface CreationBrainrot extends Omit<Brainrot, "base64Image"> {
    base64Image: Buffer;
}

const options = {
    action: createStringOption({
        description: 'Selecciona una acción para gestionar los brainrots',
        choices: [
            {
                name: 'add',
                value: 'add'
            },
            {
                name: 'list',
                value: 'list'
            },
            {
                name: 'give',
                value: 'give'
            }
        ],
        required: true
    }),
    userId: createStringOption({
        description: 'La ID del usuario al que gestionar',
    }),
    brainrotId: createStringOption({
        description: 'La ID del Brainrot a agregar'
    })
} as const;

@Declare({
    name: "brainrot",
    description: "Gestiona brainrots de la base de datos del bot",
    ignore: IgnoreCommand.Slash
})

@Options(options)

@Middlewares([ 'staff' ])

export default class BrainrotCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {

        if (ctx.options.action === 'add') {

            const brainrot: CreationBrainrot = {} as CreationBrainrot;

            let step = 0; // 0 de 8
            const message = await ctx.write({
                content: `Escribe el nombre del Brainrot.`
            }, true);

            ctx.client.collectors.create({
                event: 'MESSAGE_CREATE',
                filter: (arg) => arg.author.id === ctx.author.id,
                run: async (arg, stop): Promise<MessageStructure | undefined> => {
                    if (arg.content === 'parar' || arg.content === 'stop') {
                        const fileName = brainrot.audioFileName ?? 'nada.mp3';
                        const folderPath = path.join(process.cwd(), 'assets', 'audios');
                        const filePath = path.join(folderPath, fileName);

                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                        await arg.write({
                            content: 'Creación detenida.'
                        });

                        stop();
                    } else if (arg.content === 'guardar' || arg.content === 'save') {
                        if (step != 8) return arg.write({ content: 'Debes completar todos los pasos para hacer el guardado.' });

                        const newBrainrotInterface: Brainrot = {
                            id: brainrot.id,
                            name: brainrot.name,
                            message: brainrot.message,
                            base64Image: Buffer.from(brainrot.base64Image).toString('base64'),
                            audioFileName: brainrot.audioFileName,
                            rarity: brainrot.rarity,
                            buyPrice: brainrot.buyPrice,
                            scrapValue: brainrot.scrapValue,
                            xpReward: brainrot.xpReward,
                            levelRequeried: brainrot.levelRequeried
                        };

                        const brainrots = Database.getInstance('brainrots');
                        brainrots.set(newBrainrotInterface.id, newBrainrotInterface);

                        await arg.write({
                            content: `### Nuevo brainrot creado\n**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Precio de compra:** ${brainrot.buyPrice}\n**Bonificación de XP:** ${brainrot.xpReward}\n**Monedas al desechar:** ${brainrot.scrapValue}\n**Audio:** ${brainrot.audioFileName}`,
                            files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                        });

                        stop();
                    } else if (step == 0) {
                        brainrot.id = crypto.randomUUID();
                        brainrot.name = arg.content;
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}`
                        });
                        await arg.write({ content: 'Escribe el mensaje que el bot dirá cuando se capture el Brainrot.' });
                    } else if (step == 1) {
                        brainrot.message = arg.content;
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}`
                        });
                        await arg.write({ content: 'Escribe el nivel requerido para que aparezca el Brainrot.' });
                    } else if (step == 2) {
                        brainrot.levelRequeried = parseInt(arg.content);
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}`
                        });
                        await arg.write({ content: `Escribe la rareza del Brainrot.\nRarezas disponibles: \`${raritiesArray.join(' | ')}\`` });
                    } else if (step == 3) {
                        if (!raritiesArray.includes(arg.content as rarities)) return arg.write({ content: `No existe esa rareza.\nRarezas disponibles: \`${raritiesArray.join(' | ')}\`` });

                        brainrot.rarity = arg.content as rarities;
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}`
                        });
                        arg.write({ content: 'Adjunta la imagen del Brainrot.' });
                    } else if (step == 4) {
                        const attachment = arg.attachments[0];
                        if (!attachment) return arg.write({ content: 'Adjunta una imagen' });

                        const response = await fetch(attachment.url);
                        const arrayBuffer = await response.arrayBuffer();
                        
                        brainrot.base64Image = Buffer.from(arrayBuffer);

                        const cardBuffer = await createBrainrotCard(
                            brainrot.name,
                            brainrot.message,
                            brainrot.base64Image,
                            brainrot.rarity,
                            brainrot.levelRequeried
                        );
                        brainrot.base64Image = cardBuffer;
                        step++;


                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Imagen:** Buffer`,
                            files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                        });

                        await arg.write({ content: 'Escribe el precio de compra del Brainrot.' });
                    } else if (step == 5) {
                        brainrot.buyPrice = parseInt(arg.content);
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Precio de compra:** ${brainrot.buyPrice}`,
                            files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                        });
                        await arg.write({ content: 'Escribe la bonificación de XP.' });
                    } else if (step == 6) {
                        brainrot.xpReward = parseInt(arg.content);
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Precio de compra:** ${brainrot.buyPrice}\n**Bonificación de XP:** ${brainrot.xpReward}`,
                            files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                        });
                        await arg.write({ content: 'Escribe el precio de bonificación al desechar la carta.' });
                    } else if (step == 7) {
                        brainrot.scrapValue = parseInt(arg.content);
                        step++;

                        await message.edit({
                            content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Precio de compra:** ${brainrot.buyPrice}\n**Bonificación de XP:** ${brainrot.xpReward}\n**Monedas al desechar:** ${brainrot.scrapValue}`,
                            files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                        });
                        await arg.write({ content: 'Adjunta el fichero del audio que emitirá el brainrot.' });
                    } else if (step == 8) {
                        const attachment = arg.attachments[0];
                        if (!attachment || !attachment.contentType?.startsWith('audio/')) return arg.write({ content: 'Adjunta archivo de audio.' });

                        try {
                            const fileName = `${brainrot.id}${path.extname(attachment.filename)}`;
                            const folderPath = path.join(process.cwd(), 'assets', 'audios');
                            const filePath = path.join(folderPath, fileName);

                            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

                            const response = await fetch(attachment.url);
                            const writer = fs.createWriteStream(filePath);

                           const readable = Readable.fromWeb(response.body as ReadableStream)

                           readable.pipe(writer);
                           
                           await new Promise((resolve, reject) => {
                                writer.on('finish', resolve);
                                writer.on('error', reject);
                           });

                            brainrot.audioFileName = fileName;

                            await message.edit({
                                content: `**BrainrotId:** ${brainrot.id}\n**Nombre:** ${brainrot.name}\n**Mensaje:** ${brainrot.message}\n**Nivel requerido:** ${brainrot.levelRequeried}\n**Rareza:** ${brainrot.rarity}\n**Precio de compra:** ${brainrot.buyPrice}\n**Bonificación de XP:** ${brainrot.xpReward}\n**Monedas al desechar:** ${brainrot.scrapValue}\n**Audio:** ${fileName}`,
                                files: [ new AttachmentBuilder().setName('card.png').setFile('buffer', brainrot.base64Image) ]
                            });
                            await arg.write({ content: 'Se han terminado los pasos. Para guardar el brainrot escriba "guardar" o "save".' });
                        } catch (error) {
                            console.error(error);
                            await arg.write({ content: 'Error al descargar el audio. Inténtalo de nuevo.' });
                        }
                    }

                    return;
                }
            });

        } else if (ctx.options.action === 'list') {
            const brainrots = Database.getInstance('brainrots');
            const allBrainrots = await brainrots.all();
            const itemsPerPage = 10;
            const paginator = new Paginator(ctx, {
                data: allBrainrots.map(brainrot => brainrot.value),
                itemsPerPage,
                formatter: (currentItems: Brainrot[], currentPage: number): string => {
                    const start = currentPage * itemsPerPage;
                    return currentItems.map((brainrot: Brainrot, index) => {
                        const itemNumber = start + index + 1;
                        const padding = ' '.repeat(3 - String(itemNumber).length);
                        return `\`${padding}${itemNumber}\` **${brainrot.name}**. Nivel **${brainrot.levelRequeried}** - ${brainrot.rarity}\n- **ID: \`${brainrot.id}\`**\n`;
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
                            text: `Página ${currentPage}/${totalPages}  ${allBrainrots.length} brainrots en total`,
                            iconUrl: ctx.author.avatarURL()
                        });
                },
                middleComponent: new Button().setCustomId('sort').setLabel('⚙️').setStyle(1).setDisabled(true)
            });

            await paginator.start();

        } else if (ctx.options.action === 'give') {
            if (!ctx.options.userId || !ctx.options.brainrotId) return ctx.write({ content: 'Faltan opciones.' });
            const profiles = Database.getInstance('profiles');
            const profile: Profile = await profiles.get(ctx.options.userId);

            profile.brainrots = addBrainrot(ctx.options.brainrotId, profile.brainrots);

            await profiles.set(profile.id, profile);

            await ctx.write({
                content: `El usuario <@${ctx.options.userId}> ha recibido el brainrot **${ctx.options.brainrotId}**`
            });
        }
    }
}