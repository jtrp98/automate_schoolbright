import { Registry } from "../../engine/registry";
import { BranchSettingExecutor } from "./curiculum-setting/branchSetting/branchSetting.executor";
import { ClassSettingExecutor } from "./curiculum-setting/classSetting/classSetting.executor";
import { YearlistExecutor } from "./curiculum-setting/yearlist/yearlist.executor";
import { ClassmemberExecutor } from "./personal-employee-setting/classmember/classmember.executor";
import { EmpSignerExecutor } from "./personal-employee-setting/empSigner/empSigner.executor";
import { PermissionExecutor } from "./personal-employee-setting/permission/permission.executor";
import { TimeiosettingsExecutor } from "./personal-employee-setting/timeiosettings/timeiosettings.executor";
import { HolidaysettingsExecutor } from "./school-setting/holidaysettings/holidaysettings.executor";
import { RoomlistExecutor } from "./school-setting/roomlist/roomlist.executor";
import { SchoolProfileExecutor } from "./school-setting/schoolprofile/schoolprofile.executor";
import { SchoolsettingExecutor } from "./school-setting/schoolsetting/schoolsetting.executor";

export function registerInitialSetupModule(registry: Registry): void {

    registry.register("branchSetting.execute", BranchSettingExecutor);
    registry.register("classSetting.execute", ClassSettingExecutor);
    registry.register("yearlist.execute", YearlistExecutor);

    registry.register("classmember.execute", ClassmemberExecutor);
    registry.register("empSigner.execute", EmpSignerExecutor);
    registry.register("permission.execute", PermissionExecutor);
    registry.register("timeiosettings.execute", TimeiosettingsExecutor);

    registry.register("holidaysettings.execute", HolidaysettingsExecutor);
    registry.register("roomlist.execute", RoomlistExecutor);
    registry.register("schoolprofile.update", SchoolProfileExecutor);
    registry.register("schoolsetting.execute", SchoolsettingExecutor);

}
