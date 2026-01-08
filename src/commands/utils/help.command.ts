import { Declare, Command, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, ActionRow, Button } from 'seyfert';
import { readFileSync } from 'fs';
import path from 'path';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';

const version = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version;

@Declare({
    name: "help",
    description: "Obtén información sobre el bot",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

export default class HelpCommand extends Command {
    async run(ctx: CommandContext) {
        ctx.write({
            components: [
                new Container().setColor(process.env.SECONDARY as ColorResolvable).addComponents(
                    new TextDisplay().setContent(`# [Brainrots Bot](https://discord.com/oauth2/authorize?client_id=1453041952097566780)\n₍⟆・ **¡Colecciona Cartas Brainrot!**・₍⟆\n\n╭━─━──━─━─━─━─━─━─━─━─━─━─━━─━─━─━─━━─━─━─━─━╮\n┊• **\`Farmeo de cartas\`** \n┊• **\`Interambio de cartas\`**\n┊• **\`Coleccionar cartas\`**\n┊• **\`Lucir tus cartas a la comunidad\`**\n╰━─━──━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━─━╯`),
                    new Separator(),
                    new TextDisplay().setContent('`/farm`            **:: farmear cartas Brainrot**\n`/profile`     **:: ver tu perfil**\n`/brainrots` **:: ver todas tus cartas Brainrot**\n`/steal`          **:: robar Brainrots**\n`/trade`          **:: intercambiar cartas Brainrot**\n`/shop`            **:: compra Brainrots y lista tus ventas**\n`/decks`          **:: Lista y completa mazos**'),
                    new TextDisplay().setContent(`-# Brainrots Bot v${version} - dev by Ether.`)
                ),
                new ActionRow().addComponents(
                    new Button().setLabel('Invitar Bot a tu servidor').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1453041952097566780'),
                    new Button().setLabel(`Únete al Servidor de Soporte`).setStyle(ButtonStyle.Link).setURL('https://discord.gg/invite/YWazr86ycW')
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
}
