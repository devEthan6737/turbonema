import { ActionRow, Button, Embed, Message, CommandContext, WebhookMessage } from 'seyfert';
import { CollectorInteraction, CreateComponentCollectorResult } from 'seyfert/lib/components/handler';

export interface PaginationSelectorOptions<T = any> {
    data: T[];
    itemsPerPage: number;
    formatter: (items: T[], currentPage: number, selectedIndex: number) => string;
    embedGenerator: (currentPage: number, totalPages: number, totalItems: number, selectedIndex: number) => Embed;
    filter?: (item: T) => boolean;
    informationDescription: string,
    actionButtons: [
        Button | null,
        Button | null,
        Button | null,
        Button | null
    ];
}

export class PaginationSelector<T = any> {
    private readonly ctx: CommandContext | CollectorInteraction;
    private readonly options: PaginationSelectorOptions<T>;
    private message: WebhookMessage | Message | null = null;
    private collector!: CreateComponentCollectorResult;
    public currentPage: number = 0;
    public selectedIndex: number = -1;
    public totalPages: number;
    public filteredData: T[];

    constructor(ctx: CommandContext | CollectorInteraction, options: PaginationSelectorOptions<T>) {
        this.ctx = ctx;
        this.options = options;
        this.filteredData = this.options.filter ? this.options.data.filter(this.options.filter) : this.options.data;
        this.totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
    }

    public async start(initializeMessage: boolean = false): Promise<{ message: Message | WebhookMessage, collector: CreateComponentCollectorResult }> {
        const initialContent = this.getCurrentPageContent();
        const initialEmbed = this.getEmbed(initialContent);
        const initialComponents = this.getComponents();

        switch (initializeMessage) {
            case true:
                this.message = await this.ctx.client.messages.write((this.ctx as CollectorInteraction).channel.id, {
                    embeds: [ initialEmbed ],
                    components: initialComponents,
                });
                break;
            case false:
                this.message = await this.ctx.write({
                    embeds: [ initialEmbed ],
                    components: initialComponents,
                }, true);
                break;
        }

        await this.setupCollector();
        return {
            message: this.message,
            collector: this.collector
        }
    }

    private getCurrentPageContent(): string {
        const start = this.currentPage * this.options.itemsPerPage;
        const end = start + this.options.itemsPerPage;
        const currentItems = this.filteredData.slice(start, end);

        if (currentItems.length === 0) return 'No hay más elementos para mostrar.';

        return this.options.formatter(currentItems, this.currentPage, this.selectedIndex);
    }

    private getEmbed(description: string): Embed {
        const embed = this.options.embedGenerator(
            this.currentPage + 1,
            this.totalPages,
            this.filteredData.length,
            this.selectedIndex
        );
        embed.data.description = description;
        return embed;
    }

    public getComponents(): ActionRow[] {
        const row1 = new ActionRow().addComponents(
            new Button().setCustomId('information').setEmoji('❓').setStyle(4),
            new Button().setCustomId('up_arrow').setLabel('▲').setStyle(1).setDisabled(!(this.selectedIndex > 0)),
            this.options.actionButtons?.[0]? this.options.actionButtons[0].setDisabled(this.selectedIndex === -1) : new Button().setCustomId('empty1').setEmoji('⚫').setStyle(2).setDisabled(true)
        );
        const row2 = new ActionRow().addComponents(
            new Button().setCustomId('prev_page').setLabel('◀').setStyle(1).setDisabled(!(this.currentPage > 0)),
            this.options.actionButtons?.[1]? this.options.actionButtons[1].setDisabled(this.selectedIndex === -1) : new Button().setCustomId('empty2').setEmoji('⚫').setStyle(2).setDisabled(true),
            new Button().setCustomId('next_page').setLabel('▶').setStyle(1).setDisabled(!((this.currentPage + 1) * this.options.itemsPerPage < this.filteredData.length))
        );
        const row3 = new ActionRow().addComponents(
            this.options.actionButtons?.[2]? this.options.actionButtons[2].setDisabled(this.selectedIndex === -1) : new Button().setCustomId('empty3').setEmoji('⚫').setStyle(2).setDisabled(true),
            new Button().setCustomId('down_arrow').setLabel('▼').setStyle(1).setDisabled(!(this.selectedIndex < this.filteredData.length - 1)),
            this.options.actionButtons?.[3]? this.options.actionButtons[3].setDisabled(this.selectedIndex === -1) : new Button().setCustomId('empty4').setEmoji('⚫').setStyle(2).setDisabled(true)
        );

        return [ row1, row2, row3 ];
    }

    private setupCollector(): CreateComponentCollectorResult {
        this.collector = this.message!.createComponentCollector({
            filter: (i) => i.user.id === this.ctx.member?.id,
            timeout: 180000
        });

        this.collector.run('information', async (interaction: CollectorInteraction) => {
            const newContent = this.getCurrentPageContent();
            const newEmbed = this.getEmbed(newContent);
            newEmbed.data.description = this.options.informationDescription;

            await interaction.update({
                embeds: [ newEmbed ],
                components: [ new ActionRow().addComponents(new Button().setCustomId('back').setLabel('◀ Volver').setStyle(2)) ]
            });
        });

        this.collector.run('back', async (interaction: CollectorInteraction) => await this.updateMessage(interaction));

        this.collector.run('prev_page', async (interaction: CollectorInteraction) => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.selectedIndex = this.currentPage * this.options.itemsPerPage + (this.options.itemsPerPage - 1);
                if (this.selectedIndex >= this.filteredData.length) {
                    this.selectedIndex = this.filteredData.length - 1;
                }
                await this.updateMessage(interaction);
            }
        });

        this.collector.run('next_page', async (interaction: CollectorInteraction) => {
            if ((this.currentPage + 1) * this.options.itemsPerPage < this.filteredData.length) {
                this.currentPage++;
                this.selectedIndex = this.currentPage * this.options.itemsPerPage;
                await this.updateMessage(interaction);
            }
        });

        this.collector.run('up_arrow', async (interaction: CollectorInteraction) => {
            if (this.selectedIndex > 0) {
                this.selectedIndex--;
                this.currentPage = Math.floor(this.selectedIndex / this.options.itemsPerPage);
                await this.updateMessage(interaction);
            }
        });

        this.collector.run('down_arrow', async (interaction: CollectorInteraction) => {
            if (this.selectedIndex < this.filteredData.length - 1) {
                this.selectedIndex++;
                this.currentPage = Math.floor(this.selectedIndex / this.options.itemsPerPage);
                await this.updateMessage(interaction);
            } else if (this.selectedIndex === -1 && this.filteredData.length > 0) {
                this.selectedIndex = 0;
                this.currentPage = 0;
                await this.updateMessage(interaction);
            }
        });

        return this.collector;
    }

    public setPage(page: number) {
        this.currentPage = page;
    }

    public setSelectedIndex(index: number) {
        this.selectedIndex = index;
    }

    public getSelectedItem(): T | null {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredData.length) {
            return this.filteredData[this.selectedIndex];
        }
        return null;
    }

    public async updateMessage(interaction: CollectorInteraction, description?: string | undefined, components?: ActionRow[] | undefined, edit: boolean = false): Promise<void> {
        const newContent = this.getCurrentPageContent();
        const newEmbed = this.getEmbed(newContent);
        const newComponents = components? components : this.getComponents();

        if (description) newEmbed.data.description = description;

        if (edit) await interaction.editResponse({
            embeds: [ newEmbed ],
            components: newComponents
        });
        else await interaction.update({
            embeds: [ newEmbed ],
            components: newComponents
        });
    }

    public addCollection(customId: string, callback: (interaction: CollectorInteraction) => Promise<void>): void {
        this.collector.run(customId, async (interaction: CollectorInteraction) => {
            await callback(interaction);
            this.updateMessage(interaction);
        });
    }

    public refreshData(newData: T[]) {
        this.filteredData = this.options.filter ? newData.filter(this.options.filter) : newData;
        this.totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
        
        if (this.selectedIndex >= this.filteredData.length) this.selectedIndex = this.filteredData.length - 1;
        if (this.selectedIndex < 0 && this.filteredData.length > 0) this.selectedIndex = 0;
        if (this.currentPage >= this.totalPages) this.currentPage = Math.max(0, this.totalPages - 1);
    }
}