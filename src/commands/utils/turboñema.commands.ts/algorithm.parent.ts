import { Declare, Command, Options, IgnoreCommand } from "seyfert";
import AlgorithmConfigCommand from "./config.command";
import AlgorithmTrainCommand from "./train.command";

@Declare({
    name: "algorithm",
    description: "Configura a turboñema",
    integrationTypes: [ "GuildInstall" ],
    ignore: IgnoreCommand.Message,
})

@Options([ AlgorithmConfigCommand, AlgorithmTrainCommand ])
export default class AlgorithmCommand extends Command {}