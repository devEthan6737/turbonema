import { createEvent } from 'seyfert';
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types';

export default createEvent({
    data: { name: 'ready' },
    async run(user, client) {
        client.logger.info(`Bot Online (${user.username})`);

        client.gateway.setPresence({
            status: PresenceUpdateStatus.Online,
            activities: [
                {
                    name: `${(await (client.guilds.list())).length} servidores ♥️`,
                    type: ActivityType.Watching
                }
            ],
            afk: false,
            since: Date.now(),
        });
    }
});