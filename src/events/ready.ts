import { createEvent } from 'seyfert';
import { ActivityType, PresenceUpdateStatus } from 'seyfert/lib/types';

export default createEvent({
    data: { name: 'ready' },
    async run(user, client) {
        client.logger.info(`Bot Online (${user.username})`);

        client.gateway.setPresence({
            // random between 0 and 3:
            // dnd, idle or online
            status: [
                PresenceUpdateStatus.DoNotDisturb,
                PresenceUpdateStatus.Idle,
                PresenceUpdateStatus.Online
            ][Math.floor(Math.random() * 2)],
            activities: [
                {
                    name: `${(await (client.guilds.list())).length} servidores xd`,
                    type: ActivityType.Watching
                }
            ],
            afk: false,
            since: Date.now(),
        });
    }
});