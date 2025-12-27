import { Declare, Command, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, Section, Button, MediaGallery, MediaGalleryItem } from 'seyfert';
import { readFileSync } from 'fs';
import path from 'path';
import { MessageFlags } from 'seyfert/lib/types';

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
            content: 'ola'
        });
    }
}
