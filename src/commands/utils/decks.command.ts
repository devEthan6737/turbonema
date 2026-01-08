import { Declare, Command, type CommandContext, IgnoreCommand, ActionRow, Button, Embed, AttachmentBuilder, Modal, Label, StringSelectMenu, StringSelectOption, ModalSubmitInteraction } from 'seyfert';
import { ColorResolvable } from 'seyfert/lib/common';
import { CollectorInteraction } from 'seyfert/lib/components/handler';
import { ButtonStyle } from 'seyfert/lib/types';
import { generateDeckImage } from '../../systems/canvas';
import { addBrainrot, removeBrainrot } from '../../systems/containers';
import { createProfile } from '../../systems/Database/createProfile';
import Database from '../../systems/Database/database';
import { Brainrot, Deck, Profile, RarityMap } from '../../systems/Database/interfaces';
import { addXP } from '../../systems/levels';

type ContextWriteOptions = Parameters<CommandContext["write"]>[0];
type CollectorWriteOptions = Parameters<CollectorInteraction["update"]>[0];

@Declare({
    name: "decks",
    description: "Completa mazos de cartas",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

export default class DecksCommand extends Command {
    async run(ctx: CommandContext) {
        const profiles = Database.getInstance('profiles');
        let profile: Profile;

        if (!await profiles.has(ctx.author.id)) {
            profile = await createProfile(ctx);
            await profiles.set(ctx.author.id, profile);
        } else profile = await profiles.get(ctx.author.id);

        if (!profile || !profile.brainrots.length) return ctx.write({ content: "¡No tienes Brainrots!" });

        const decks = Database.getInstance('decks');
        let totalDecks = (await decks.all()).map(deck => deck.value);

        let currentPage = 0;
        const totalPages = totalDecks.length;

        const getMessagePayload = async (page: number): Promise<ContextWriteOptions> => {
            const deck: Deck = totalDecks[page];
            const profileDeck = profile.decks.find(d => d.id === deck.id);
            const alreadyCollectedIds = profileDeck ? profileDeck.collectedCards : [];

            const brainrots = Database.getInstance('brainrots');

            const collectedCardsData = await Promise.all(
                alreadyCollectedIds.map(async (BrainrotId) => {
                    const brainrot: Brainrot = await brainrots.get(BrainrotId);
                    return {
                        name: brainrot.name,
                        img: brainrot.base64Image,
                        id: brainrot.id
                    };
                })
            );

            const missingCardsIds = deck.cardIds.filter(id => !alreadyCollectedIds.includes(id));

            const missingCardsData = await Promise.all(
                missingCardsIds.map(async (BrainrotId) => {
                    const brainrot = await brainrots.get(BrainrotId) as Brainrot;
                    return {
                        name: brainrot.name,
                        img: brainrot.base64Image,
                        id: brainrot.id
                    };
                })
            );

            const canvas = await generateDeckImage(
                collectedCardsData,
                missingCardsData,
                deck.rarity
            );

            const components = [
                new ActionRow().addComponents(
                    new Button().setCustomId('prev').setLabel('↢').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                    new Button().setCustomId('page').setLabel(`${page + 1}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new Button().setCustomId('next').setLabel('↣').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                )
            ];

            const collectedIds = profileDeck?.collectedCards ?? [];
            const availableToFill = profile.brainrots.filter(pb => deck.cardIds.includes(pb.id) && pb.amount > 0 && !collectedIds.includes(pb.id));

            if (collectedIds.length < deck.cardIds.length && availableToFill.length > 0) {
                components.push(
                    new ActionRow().addComponents(
                        new Button().setCustomId('addcard').setLabel('Agregar carta').setStyle(ButtonStyle.Success).setEmoji('<:agregarcarpeta:1454876358504349879>')
                    )
                );
            }

            if (collectedIds.length === deck.cardIds.length && !(profileDeck?.claimed)) {
                components.push(
                    new ActionRow().addComponents(
                        new Button().setCustomId('claim').setLabel('Reclamar recompensas').setStyle(ButtonStyle.Success).setEmoji('<:comprobar:1454876797572350064>')
                    )
                )
            }

            const brainrotCardReward: Brainrot | undefined = await brainrots.get(deck.reward.exclusiveCardId ?? '');
            const rewards = [];

            if (!profileDeck?.claimed) {
                if (brainrotCardReward) rewards.push(`**Carta de recompensa :: ${brainrotCardReward.name}**`);
                if (deck.reward.credits) rewards.push(`**AuraCoins :: ${deck.reward.credits}**<:auracoin:1454515337503576114>`);
                if (deck.reward.money) rewards.push(`**BrainCoins :: ${deck.reward.money}**<:braincoin:1454101560903598307>`);
                if (deck.reward.xp) rewards.push(`**XP :: ${deck.reward.xp}xp**<:experiencia:1454102939026194502>`);
            }

            return {
                embeds: [
                    new Embed()
                        .setTitle(`${RarityMap[deck.rarity].emoji} ${deck.name} ✨`)
                        .setColor(process.env.SECONDARY as ColorResolvable)
                        .setDescription(!profileDeck?.claimed? rewards.length > 0? `**Recompensas por completar el mazo**\n${rewards.join('\n')}` : '**Sin recompensas por completar el mazo.**' : '<:comprobar:1454876797572350064> **Recompensas reclamadas**')
                        .setImage('attachment://deck.png')
                        .setFooter({ text: `Mazo ${page + 1} de ${totalPages}` })
                ],
                components: components,
                files: [
                    new AttachmentBuilder().setName('deck.png').setFile('buffer', canvas!)
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

        collector.run('claim', async (interaction: CollectorInteraction): Promise<any> => {
            const deck: Deck = totalDecks[currentPage];
            const profileDeck = profile.decks.find(d => d.id === deck.id);

            if (!profileDeck?.claimed) {
                profile.decks = profile.decks.map(d => d.id === deck.id ? { ...d, claimed: true } : d);

                if (deck.reward.exclusiveCardId) profile.brainrots = addBrainrot(deck.reward.exclusiveCardId, profile.brainrots);
                if (deck.reward.credits) profile.credits += deck.reward.credits;
                if (deck.reward.money) profile.money += deck.reward.money;
                if (deck.reward.xp) profile.level = addXP(profile.level, deck.reward.xp);

                await profiles.set(profile.id, profile);
            }

            await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);
        });

        collector.run('addcard', async (interaction: CollectorInteraction): Promise<any> => {
            const brainrots = Database.getInstance('brainrots');
            const currentDeck = totalDecks[currentPage];
            const profileDeck = profile.decks.find(d => d.id === currentDeck.id);
            const alreadyCollected = profileDeck ? profileDeck.collectedCards : [];
            const availableCards = profile.brainrots.filter(pb => currentDeck.cardIds.includes(pb.id) && pb.amount > 0 && !alreadyCollected.includes(pb.id));

            if (availableCards.length === 0) return await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);

            const options = await Promise.all(
                availableCards.map(async (profileBrainrot) => {
                    const brainrot: Brainrot = await brainrots.get(profileBrainrot.id);
                    return new StringSelectOption()
                        .setLabel(brainrot.name)
                        .setValue(brainrot.id)
                        .setEmoji(RarityMap[brainrot.rarity].emoji)
                        .setDescription(`Tienes ${profileBrainrot.amount} unidades`);
                })
            );

            interaction.modal(
                new Modal()
                    .setCustomId('modal')
                    .setTitle(`Ofrecer un Brainrot`)
                    .addComponents([
                        new Label()
                            .setLabel('Elegir Brainrot')
                            .setComponent(
                                new StringSelectMenu()
                                    .setCustomId('brainrot')
                                    .setOptions(options)
                            )
                    ])
                    .run(modalReply)
            );
        });

        async function modalReply(interaction: ModalSubmitInteraction) {
            if (interaction.data.components[0].component.values) {
                let deck = profile.decks.find(x => x.id === totalDecks[currentPage].id);

                if (!deck) {
                    profile.decks.push({
                        id: totalDecks[currentPage].id,
                        collectedCards: [ interaction.data.components[0].component.values[0] ]
                    });
                } else {
                    deck.collectedCards.push(interaction.data.components[0].component.values[0]);

                    profile.decks = profile.decks.filter(deck => deck.id != totalDecks[currentPage].id);
                    profile.decks.push(deck);
                }

                profile.brainrots = removeBrainrot(interaction.data.components[0].component.values[0], profile.brainrots);

                await profiles.set(profile.id, profile);
            }

            totalDecks = (await decks.all()).map(deck => deck.value);

            await interaction.update(await getMessagePayload(currentPage) as CollectorWriteOptions);
        }
    }
}
