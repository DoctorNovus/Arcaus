import fs from "fs";
import BSON from "bson";

export class WorldManager {

    /**
     * Creates a world with inputted text
     * @param {String} name name of the world
     */
    static createWorld(name) {
        let world = {
            name: name
        };

        world.owner = null;
        world.map = WorldManager.createMap();

        worlds[name] = world;
        fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(world));

        return world;
    }

    /**
     * Creates a map as a blank state for a world
     */
    static createMap() {
        let map = [];

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                map.push({
                    tile: "cobble",
                    type: "backdrop",
                    x: i * 96,
                    y: j * 96
                });
            }
        }

        return map;
    }
}