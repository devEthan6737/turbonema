import { Declare, Command, type CommandContext, IgnoreCommand, Container, TextDisplay, Separator, ActionRow, Button } from 'seyfert';
import { readFileSync } from 'fs';
import path from 'path';
import { ColorResolvable } from 'seyfert/lib/common';
import { ButtonStyle, MessageFlags } from 'seyfert/lib/types';

const version = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version;

@Declare({
    name: "help",
    description: "Información sobre Turboñema",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

export default class HelpCommand extends Command {
    async run(ctx: CommandContext) {
        ctx.write({
            components: [
                new Container()
                    .setColor(process.env.SECONDARY as ColorResolvable)
                    .addComponents(
                        new TextDisplay().setContent(`# Turboñema V1\n₍⟆・ **Generación de respuestas con Markov Chains** ・₍⟆\n\nTurboñema aprende de los mensajes del servidor y genera respuestas automáticas basadas en cadenas de Markov.\n╭━━━━━━━━━━━━━━━━━━━━╮\n┊ • Aprende de mensajes reales\n┊ • Genera respuestas dinámicas\n┊ • Configuración por canal/categoría/global\n┊ • Control total del entrenamiento\n╰━━━━━━━━━━━━━━━━━━━━╯`),
                        new Separator(),
                        new TextDisplay().setContent(`### ⚙️ Configuración\n\`/config\` **:: Ajusta el comportamiento del bot**\n- Activar / desactivar algoritmo\n- Tipo de integración (global, canal, categoría)\n- Frecuencia de respuesta\n- Límite de mensajes analizados`),
                        new TextDisplay().setContent(`### 🧠 Entrenamiento\n\`/train\` **:: Gestiona el aprendizaje**\n- Activar / desactivar entrenamiento\n- Definir mínimo y máximo de cadenas\n- Ver uso de memoria (malla)\n- Resetear datos de aprendizaje`),
                        new Separator(),
                        new TextDisplay().setContent(`### 🧩 Cómo funciona\nTurboñema usa **Markov Chains**:\n- Divide mensajes en secuencias\n- Aprende relaciones entre palabras/emojis/gifs\n- Genera respuestas probabilísticas en base a ese histórico\n\n⚠️ Cuanto más entrene, mejor responde (pero más memoria consume).`),
                        new Separator(),
                        new TextDisplay().setContent(`-# Turboñema v${version} - dev by Ether.`)
                    ),
                new ActionRow().addComponents(
                    new Button()
                        .setLabel('Invitar Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/oauth2/authorize?client_id=1453041952097566780'),
                    new Button()
                        .setLabel('Servidor de Soporte')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/invite/YWazr86ycW')
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }
}