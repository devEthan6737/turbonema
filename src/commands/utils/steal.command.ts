import ms from 'ms';
import { Declare, Command, type CommandContext, IgnoreCommand, Options, createUserOption, createStringOption, AutocompleteInteraction, Container, TextDisplay, MediaGallery, MediaGalleryItem, AttachmentBuilder, Separator, ActionRow, Button } from 'seyfert';
import { ColorResolvable, Formatter, TimestampStyle } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';
import { addBrainrot, removeBrainrot } from '../../systems/containers';
import { createProfile } from '../../systems/Database/createProfile';
import Database from '../../systems/Database/database';
import { Brainrot, Profile, RarityMap } from '../../systems/Database/interfaces';
import { addXP } from '../../systems/levels';

const options = {
    member: createUserOption({
        description: 'El usuario al que deseas robar',
        required: true
    }),
    brainrot: createStringOption({
        description: 'Elige el brainrot a robar',
        autocomplete: async (interaction: AutocompleteInteraction) => {
            const profiles = Database.getInstance('profiles');
            let profile: Profile;

            const mentionId = interaction.options.get('member')?.value;
            if (!mentionId || typeof mentionId != 'string') return;

            if (!await profiles.has(mentionId)) {
                profile = await createProfile(interaction);
                await profiles.set(mentionId, profile);
            } else profile = await profiles.get(mentionId);

            if (!await profiles.has(interaction.user.id)) await profiles.set(interaction.user.id, await createProfile(interaction));

            if (!profile || !profile.brainrots.length) return;

            const brainrots = Database.getInstance('brainrots');
            const userBrainrots = await Promise.all(
                profile.brainrots.map(async (b) => {
                    const info = await brainrots.get(b.id) as Brainrot;
                    return { ...info, amount: b.amount, protectedUntil: b.protectedUntil };
                })
            );

            interaction.respond(
                userBrainrots
                    .filter(brainrot => {
                        const isProtected = brainrot.protectedUntil && brainrot.protectedUntil > Date.now();
                        return !isProtected;
                    })
                    .map((brainrot) => {
                        return {
                            name: brainrot.name,
                            value: brainrot.id
                        };
                    })
                    .slice(0, 25)
            );
        },
        required: true
    })
} as const;

@Declare({
    name: "steal",
    description: "Roba un brainrot a un usuario",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

@Options(options)

export default class StealCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.options.brainrot) return ctx.write({ content: 'No se ha especificado un brainrot.' });
        if (ctx.options.member.id == ctx.client.me.id || ctx.options.member.id == ctx.author.id) return ctx.write({ content: 'qué' });

        const brainrots = Database.getInstance('brainrots');
        if (!await brainrots.has(ctx.options.brainrot)) return ctx.write({ content: `El brainrot **${ctx.options.brainrot}** no existe.` });

        const profiles = Database.getInstance('profiles');
        const userProfile: Profile = await profiles.get(ctx.author.id);
        const mentionProfile: Profile = await profiles.get(ctx.options.member.id);

        if (userProfile.nextSteal && userProfile.nextSteal > Date.now()) return ctx.write({
            content: `Podrás volver a usar este comando ${Formatter.timestamp(new Date(userProfile.nextSteal), TimestampStyle.RelativeTime)}\n\nConsume **100**<:auracoin:1454515337503576114> para **resetear el cooldown ahora**.`,
            components: [
                new ActionRow().addComponents(
                    new Button().setCustomId('resetstealcooldown').setLabel('Resetear cooldown').setEmoji('<:auracoin:1454515337503576114>').setStyle(ButtonStyle.Primary)
                )
            ]
        });
        if (!mentionProfile.brainrots.find(brainrot => brainrot.id == ctx.options.brainrot)) return ctx.write({ content: 'No he encontrado el brainrot en el perfil del usuario.' });

        userProfile.nextSteal = (
            mentionProfile.money > 100000 || mentionProfile.credits > 2500? Date.now() + ms('2h') : // usuario rico
                mentionProfile.money < 1000 || mentionProfile.credits < 250? Date.now() + ms('4h') : // usuario pobre
                    ms('3h') // usuario normal
        );

        if (Math.floor(Math.random() * 101) < 20) {
            await profiles.set(ctx.author.id, userProfile);
            return ctx.write({ content: 'Has fallado al robar el Brainrot.' });
        }

        mentionProfile.brainrots = removeBrainrot(ctx.options.brainrot, mentionProfile.brainrots);
        userProfile.brainrots = addBrainrot(ctx.options.brainrot, userProfile.brainrots);

        const xpToAdd = Math.floor(Math.random() * 31);
        userProfile.level = addXP(userProfile.level, xpToAdd);

        await profiles.set(ctx.author.id, userProfile);
        await profiles.set(ctx.options.member.id, mentionProfile);

        const brainrot: Brainrot = await brainrots.get(ctx.options.brainrot);

        ctx.write({
            components: [
                new Container().setColor(process.env.PRIMARY as ColorResolvable).addComponents(
                    new TextDisplay().setContent(`## <:robo:1454628814939230218> Le has robado un **${brainrot.name}** a ${ctx.options.member.username}`),
                    new Separator(),
                    new TextDisplay().setContent(`**${brainrot.name} \`${RarityMap[brainrot.rarity].emoji} ${RarityMap[brainrot.rarity].translation}\`**\n<:trofeo:1454102940720562306> **Nivel :: ${brainrot.levelRequeried}**\n**A la venta por ${brainrot.buyPrice}<:braincoin:1454101560903598307>**\n**Desechable por ${brainrot.scrapValue}<:braincoin:1454101560903598307>**\n<:repost:1454139857633804491> Podrás volver a usar este comando ${Formatter.timestamp(new Date(userProfile.nextSteal), TimestampStyle.RelativeTime)}\n<:experiencia:1454102939026194502> Has obtenido **${xpToAdd}xp**`),
                    new Separator(),
                    new TextDisplay().setContent(`<:flecha:1454630283977429157> Robar a un usuario **rico** impone un cooldown de **2 horas**\n<:flecha:1454630283977429157> Robar a un usuario **pobre** impone un cooldown de **4 horas**\n<:flecha:1454630283977429157> En cualquier otro caso se impone un cooldown de **3 horas**.`),
                    new MediaGallery().setItems(
                        new MediaGalleryItem().setMedia(`attachment://brainrot_image.png`)
                    ),
                    new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                )
            ],
            files: [ new AttachmentBuilder().setName('brainrot_image.png').setFile('buffer', Buffer.from(brainrot.base64Image, "base64")) ],
            flags: MessageFlags.IsComponentsV2
        });
    }
}
