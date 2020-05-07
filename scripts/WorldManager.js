import fs from "fs";
import BSON from "bson";
import { Rectangle } from "./Rectangle";
import { Dungeon } from "./Blueprints/dungeon";

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
        world.count = 0;
        worlds[name] = world;
        fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(world));

        return world;
    }

    static saveWorld(name) {
        fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(worlds[name]));
    }

    static collidesWithTile(world, x, y) {
        for (let tile of world.map) {
            let rect = new Rectangle(tile.x - 96 / 2, tile.y, 96, 96);
            if (rect.contains(x, y)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Creates a map as a blank state for a world
     */
    static createMap() {
        let map = [];

        let height = randBetween(50, 75);
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < height; j++) {
                let choice = randTwo(["dungeon", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", ])
                if (choice == "cobble") {
                    let finds = map.map(m => ({ x: m.x, y: m.x }));
                    if (!finds.find(t => t.x == i * 96 && t.y == j * 96)) {
                        map.push({
                            tile: randTwo(["cobble", "cobble", "cobble", "cobble", "rock"]),
                            type: "backdrop",
                            x: i * 96,
                            y: j * 96
                        });
                    }
                } else {
                    let dung = new Dungeon();
                    if (dung.compile().length > 0) {
                        for (let tile of dung.compile()) {
                            map.push({
                                tile: tile.name,
                                type: "backdrop",
                                x: i * 96 + tile.x,
                                y: i * 96 + tile.y
                            });
                        }
                    }
                }
            }

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96
            });

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96 + 96
            });

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96 + 96 * 2
            });

            height += randBetween(-1, 1);
        }

        return map;
    }
}

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randTwo(arr) {
    return arr[randBetween(0, arr.length - 1)];
}