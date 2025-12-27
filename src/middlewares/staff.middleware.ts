import { createMiddleware } from "seyfert";
 
export const staffMiddleware = createMiddleware<void>(
    async (middle) => {
        if (!middle.context.member?.roles.keys.includes('1453058023625855132')) return middle.context.write({ content: 'Solo **los creadores del bot** pueden ejecutar este comando.' });

        return middle.next();
    }
);