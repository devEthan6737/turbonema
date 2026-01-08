import { Declare, Command, Options, IgnoreCommand } from "seyfert";
import ListShopCommand from "./list.command";
import BuyShopCommand from "./buy.command";

@Declare({
    name: "shop",
    description: "Tienda global",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message
})

@Options([ ListShopCommand, BuyShopCommand ])
export default class WorkstationCommand extends Command {}