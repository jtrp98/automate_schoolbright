import { Registry } from "../../engine/registry";
import { LoginExecutor } from "./login.executor";

export function registerLoginModule(registry: Registry): void {

    registry.register("login.execute", LoginExecutor);

}
