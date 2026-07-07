import { Executor } from "../core/interfaces";
import { registerLoginModule } from "../modules/[0]login/login.registry";
import { registerPersonalInfoModule } from "../modules/[1]personal-info/personal-info.registry";
import { registerAcademicModule } from "../modules/[2]academic/academic.registry";
import { registerStudentAffairsModule } from "../modules/[3]student-affairs/student-affairs.registry";
import { registerGeneralAdminModule } from "../modules/[4]general-admin/general-admin.registry";
import { registerAccountingModule } from "../modules/[5]accounting/accounting.registry";
import { registerStoreModule } from "../modules/[6]store/store.registry";
import { registerReportModule } from "../modules/[7]report/report.registry";
import { registerInitialSetupModule } from "../modules/[8]initial-setup/initial-setup.registry";

type ExecutorClass = new () => Executor;

export class Registry {

    private readonly executors = new Map<string, ExecutorClass>();

    register(functionKey: string, executorClass: ExecutorClass): void {

        this.executors.set(functionKey, executorClass);

    }

    resolve(functionKey: string): Executor {

        const ExecutorClass = this.executors.get(functionKey);

        if (!ExecutorClass) {

            throw new Error(`Executor not found for function: ${functionKey}`);

        }

        return new ExecutorClass();

    }

}

export function createRegistry(): Registry {

    const registry = new Registry();

    registerLoginModule(registry);
    registerPersonalInfoModule(registry);
    registerAcademicModule(registry);
    registerStudentAffairsModule(registry);
    registerGeneralAdminModule(registry);
    registerAccountingModule(registry);
    registerStoreModule(registry);
    registerReportModule(registry);
    registerInitialSetupModule(registry);

    return registry;

}
