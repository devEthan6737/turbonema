import { Declare, Command, Options, IgnoreCommand } from "seyfert";

@Declare({
    name: "turboñema",
    description: "Configura a turboñema",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message,
    botPermissions: [ 'AddReactions', 'SendMessages', 'ViewChannel' ],
    defaultMemberPermissions: [ 'Administrator' ]
})

@Options([  ])
export default class TurboñemaCommand extends Command {}