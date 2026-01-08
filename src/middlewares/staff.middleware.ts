import { createMiddleware } from "seyfert";
 
export const staffMiddleware = createMiddleware<void>(
    async (middle) => {
        const guild = await middle.context.client.guilds.fetch('1453029211454443564');
        const member = await guild.members.fetch(middle.context.author.id);

        if (!member.roles.keys.includes('1453058023625855132')) return middle.context.write({ content: 'Solo **los creadores del bot** pueden ejecutar este comando.' });

        return middle.next();
    }
);