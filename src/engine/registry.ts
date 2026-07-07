export class Registry {

    get(name: string) {

        throw new Error(`${name} executor not found`);

    }

}