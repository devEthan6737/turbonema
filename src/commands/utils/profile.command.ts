import { Declare, Command, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, Section, Button, Embed } from 'seyfert';
import Database from '../../systems/db/database';
import { Brainrot, Profile, rarities, RarityMap, rarityOrder } from '../../systems/db/interfaces';
import { createNumericalProgressBar, formatNumberWithDots } from '../../systems/utils';
import { getFormattedLevel, getLevelName, getNextLevelXP } from '../../systems/levels';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';
import { ColorResolvable } from 'seyfert/lib/common';
import { createProfile } from '../../systems/db/createProfile';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { Paginator } from '../../systems/messages/Paginator';

@Declare({
    name: "profile",
    description: "Visualiza tu perfil",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

export default class ProfileCommand extends Command {
    async run(ctx: CommandContext) {
        const brainrots = Database.getInstance('brainrots');
        const profiles = Database.getInstance('profiles');
        let profile: Profile;

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        const levelProgress = createNumericalProgressBar(getNextLevelXP(profile.level.level), profile.level.xp);

        const message = await ctx.write({
            components: [
                new Container().setColor(process.env.PRIMARY as ColorResolvable).addComponents(
                    new TextDisplay().setContent(`# Perfil de ${ctx.author.username} ✨`),
                    new Section()
                        .setComponents(new TextDisplay().setContent(`### Tienes ${profile.brainrots.length} ${profile.brainrots.length == 1 ? 'brainrot' : 'brainrots'} 🤑\n<:meme:1454112604267090112> ${profile.brainrots.length > 0? 'Tus cinco mejores brainrots:' : '¡Usa **/farm** para conseguir brainrots!'}\n${(await Promise.all(profile.brainrots.map(async (b) => ({ ...b, info: await brainrots.get(b.id) })))).sort((a, b) => b.info.levelRequeried - a.info.levelRequeried || rarityOrder[b.info.rarity as keyof typeof rarityOrder] - rarityOrder[a.info.rarity as keyof typeof rarityOrder]).slice(0, 5).map((b, i) => `\` ${i + 1} \` **${b.info.name} ${b.amount > 1? `x${b.amount}` : ''}**`).join('\n')}`))
                        .setAccessory(new Button().setStyle(ButtonStyle.Primary).setCustomId('watch').setLabel('Ver brainrots').setEmoji('🔎').setDisabled(profile.brainrots.length == 0)),
                    new Separator(),
                    new TextDisplay().setContent(`> <:braincoin:1454101560903598307> **Braincoins:** **${formatNumberWithDots(profile.money)}**<:braincoin:1454101560903598307>\n> <:trofeo:1454102940720562306> **Nivel** **::** **${getFormattedLevel(profile.level.level, 'level')}** (${getLevelName(profile.level.level)})\n> <:experiencia:1454102939026194502> **XP** **::** **${profile.level.xp}/${getNextLevelXP(profile.level.level)}**\n### Restante para el nivel ${getFormattedLevel(profile.level.level + 1, 'level')} (${levelProgress.progress}%):\n${getFormattedLevel(profile.level.xp, 'xp')}xp ${levelProgress.bar} ${getFormattedLevel(getNextLevelXP(profile.level.level), 'xp')}xp`),
                    new TextDisplay().setContent(`-# Brainrots Bot - dev by Ether.`)
                )
            ],
            flags: MessageFlags.IsComponentsV2
        }, true);

        const collector = message.createComponentCollector({
            filter: (i) => i.user.id == ctx.author.id
        });

        collector.run('watch', async (interaction: CollectorInteraction) => {
            await interaction.deferUpdate();

            const itemsPerPage = 10;
            const paginator = new Paginator(interaction, {
                data: await Promise.all(profile.brainrots.map(async (brainrot) => {
                    const br: Brainrot = await brainrots.get(brainrot.id);
                    return { ...br, amount: brainrot.amount };
                })),
                itemsPerPage,
                formatter: (currentItems, currentPage: number): string => {
                    const start = currentPage * itemsPerPage;
                    return `Usa **/brainrots** para apreciarlos mejor.\n\n` + currentItems.map((brainrot, index) => {
                        const itemNumber = start + index + 1;
                        const padding = ' '.repeat(3 - String(itemNumber).length);
                        return `\`${padding}${itemNumber}\` **${brainrot.name} ${brainrot.amount > 1? `x${brainrot.amount}` : ''} \`${RarityMap[brainrot.rarity as rarities].emoji} ${RarityMap[brainrot.rarity as rarities].translation}\`**`;
                    }).join('\n');
                },
                embedGenerator: (currentPage: number, totalPages: number): Embed => {
                    return new Embed()
                        .setAuthor({
                            name: `Tus brainrots`,
                            iconUrl: ctx.client.me.avatarURL()
                        })
                        .setColor(process.env.PRIMARY as ColorResolvable)
                        .setFooter({
                            text: `Página ${currentPage}/${totalPages}`,
                            iconUrl: ctx.author.avatarURL()
                        });
                },
                middleComponent: new Button().setCustomId('sort').setLabel('⚙️').setStyle(1).setDisabled(true)
            });
            
            await paginator.start();
        });
    }
}
