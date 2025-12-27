import { ComponentCommand, type ComponentContext } from 'seyfert';

import { MessageFlags } from 'seyfert/lib/types';

export default class HelloWorldButton extends ComponentCommand {
  componentType = 'Button' as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === 'hello-world';
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.write({
      content: 'Hello World 👋',
      flags: MessageFlags.Ephemeral
    });
  }
}