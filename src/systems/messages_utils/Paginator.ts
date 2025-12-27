import { ActionRow, Button, Embed, CommandContext } from 'seyfert';
import { CollectorInteraction, CreateComponentCollectorResult } from 'seyfert/lib/components/handler';
import { MessageInstanceCallback } from './MessageInstance';
import { MessageCreateBodyRequest } from 'seyfert/lib/common';

export interface PaginatorOptions {
    data: any[];
    itemsPerPage: number;
    formatter: (items: any[], currentPage: number) => string;
    embedGenerator: (currentPage: number, totalPages: number, totalItems: number) => Embed;
    MessageInstancerCallback?: Function,
    middleComponent: Button | ((currentPage: number, totalPages: number, data: any[]) => Button);
    simulation?: Paginator;
}

export class Paginator {
    private readonly ctx: CommandContext | CollectorInteraction;
    private readonly options: PaginatorOptions;
    private parent: Paginator | undefined;
    private child: Paginator | undefined;
    public collector: CreateComponentCollectorResult | any;
    public readonly MessageInstancer: MessageInstanceCallback = new MessageInstanceCallback(async () => {
        const message = {
            embeds: [ this.getEmbed() ],
            components: this.getComponents(),
            content: null,
            flags: 0
        };

        if (this.parent) message.components?.push(new ActionRow().addComponents(new Button().setCustomId('back').setLabel('◀ Volver').setStyle(2)) as any);

        return message;
    });
    public currentPage: number = 0;
    public readonly totalPages: number;
    public readonly Items: object[];
    public data: any;

    constructor(ctx: CommandContext | CollectorInteraction, options: PaginatorOptions) {
        this.ctx = ctx;
        this.options = options;
        this.totalPages = Math.ceil(this.options.data.length / this.options.itemsPerPage);
        this.Items = options.data;
        if (options.simulation) this.parent = options.simulation;
    }

    public async start() {
        if (this.options.simulation) {
            this.collector = this.parent?.collector;
            (this.ctx as any).editResponse(await this.MessageInstancer.resolve() as any)
        } else {
            if ('update' in this.ctx) {
                this.collector = (
                    await this.ctx.client.messages.write(
                        (this.ctx as CollectorInteraction).channel.id,
                        await this.MessageInstancer.resolve()
                    )
                ).createComponentCollector({
                    filter: (i: any) => i.user.id === this.ctx.member?.id,
                    timeout: 180000
                })
            } else {
                this.collector = (
                    await this.ctx.write(
                        await this.MessageInstancer.resolve(),
                        true,
                    )
                ).createComponentCollector({
                    filter: (i: any) => i.user.id === this.ctx.member?.id,
                    timeout: 180000,
                });
            }
        }

        this.setupCollector();
    }

    private getCurrentPageContent(): string {
        const start = this.currentPage * this.options.itemsPerPage;
        const end = start + this.options.itemsPerPage;
        const currentItems = this.options.data.slice(start, end);

        if (currentItems.length === 0) return 'No hay más elementos para mostrar.';

        return this.options.formatter(currentItems, this.currentPage);
    }

    private getEmbed(description?: string): Embed {
        const embed = this.options.embedGenerator(
            this.currentPage + 1,
            this.totalPages,
            this.options.data.length
        );
        if (description) embed.data.description = description;
        else embed.data.description = this.getCurrentPageContent();

        return embed;
    }

    public getComponents(): ActionRow[] {
        const hasPrev = this.currentPage > 0;
        const hasNext = (this.currentPage + 1) * this.options.itemsPerPage < this.options.data.length;

        const prevButton = new Button()
            .setCustomId('prev_page')
            .setLabel('↢')
            .setStyle(1)
            .setDisabled(!hasPrev);

        const nextButton = new Button()
            .setCustomId('next_page')
            .setLabel('↣')
            .setStyle(1)
            .setDisabled(!hasNext);

        let middleButton: Button;
        if (typeof this.options.middleComponent === 'function') middleButton = (this.options.middleComponent as Function)(this.currentPage, this.totalPages, this.options.data);
        else middleButton = this.options.middleComponent;

        return [new ActionRow().addComponents(prevButton, middleButton, nextButton)];
    }

    private setupCollector() {
        this.run('next_page', async (interaction: CollectorInteraction) => {
            if (this.child) {
                if ((this.child.currentPage + 1) * this.child.options.itemsPerPage < this.child.options.data.length) {
                    this.child.currentPage++;
                    await this.child.updateMessage(interaction, await this.child.MessageInstancer.resolve());
                }
            } else {
                if ((this.currentPage + 1) * this.options.itemsPerPage < this.options.data.length) {
                    this.currentPage++;
                    await this.updateMessage(interaction, await this.MessageInstancer.resolve());
                }
            }
        });

        this.run('prev_page', async (interaction: CollectorInteraction) => {
            if (this.child) {
                if (this.child.currentPage > 0) {
                    this.child.currentPage--;
                    await this.child.updateMessage(interaction, await this.child.MessageInstancer.resolve());
                }
            } else {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    await this.updateMessage(interaction, await this.MessageInstancer.resolve());
                }
            }
        });

        if (this.parent) this.run('back', async (interaction: CollectorInteraction) => {
            (this.parent as Paginator).child = undefined;
            this.updateMessage(interaction, await (this.parent as Paginator).MessageInstancer.resolve());
        });
    }

    public setPage(page: number) {
        this.currentPage = page;
    }

    public async updateMessage(interaction: CollectorInteraction, message: MessageCreateBodyRequest) {
        await interaction.update(message as any);
    }

    public run(customId: string, callback: (interaction: CollectorInteraction) => Promise<void>): void {
        this.collector.run(customId, async (interaction: CollectorInteraction) => {
            await callback(interaction);
        });
    }

    public setChild(child: Paginator) {
        this.child = child;
    }
}
