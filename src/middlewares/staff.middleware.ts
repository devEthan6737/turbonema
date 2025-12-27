import { createMiddleware } from "seyfert";
 
export const staffMiddleware = createMiddleware<void>(
    async (middle) => {
        if (!(await middle.context.member?.roles.list())?.map(r => r.id).includes('1453058023625855132')) return middle.context.write({ content: 'Solo **los creadores del bot** pueden ejecutar este comando.' });

        return middle.next();
    }
);