export interface PageConfig {

    page: string;

    fields: string[];

}

export const PageConfigs: PageConfig[] = [

    {
        page: "grade-report",

        fields: [
            "year",
            "term",
            "level",
            "room"
        ]
    },

    {
        page: "student-profile",

        fields: [
            "firstname",
            "lastname"
        ]
    }

];