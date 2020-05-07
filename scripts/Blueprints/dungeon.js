import { Blueprint } from "./blueprint";

export class Dungeon extends Blueprint {
    constructor() {
        super("dungeon");

        super.setNameById(1, "rock");

        super.setTiles([
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ])
    }


}