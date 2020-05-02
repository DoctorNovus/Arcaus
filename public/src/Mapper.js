import { Sector } from "./Sector";

export class Mapper {
    static findSector(game, x, y) {
        for (let tile of game.world.map) {
            let sector = new Sector(
                tile.x,
                tile.y,
                96, 96,
                tile.type,
                game.materials[tile.tile]
            );
            if (sector.rect.contains(x, y)) {
                return sector;
            }
        }

        return undefined;
    }

    static collidesWithObject(object, x, y) {
        if (game.world) {
            object.rect.x += x;
            object.rect.y += y;

            for (let tile of game.world.map) {
                if (tile.type == "wall") {
                    if (tile.rect.collides(object.rect)) return true;
                }
            }

            return false;
        }
    }

    static getSurrounding(game, x, y, width, height) {
        if (!Mapper.findSector(game, x, y + height)) {
            return "core";
        } else {
            return "top";
        }
    }
}