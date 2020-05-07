export class BlueprintManager {
    constructor() {
        this.blueprints = {};
    }

    getBlueprint(name) {
        return this.blueprints[name];
    }

    saveBlueprint(blueprint) {
        this.blueprints[blueprint.name] = blueprint;
    }
}