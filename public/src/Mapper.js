import { Sector } from "./Sector";

export class Mapper {
    static findSector(x, y) {
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

    static movement(socket) {
        let p = game.players.find((p) => p.id == game.playerID);
        if (p.direction.up) {
            if (!Mapper.collidesWithObject(p, 0, 5)) {
                socket.send({
                    type: "move",
                    pos: {
                        x: p.x,
                        y: p.y + 5,
                    },
                });
            }
        }

        if (p.direction.left) {
            if (!Mapper.collidesWithObject(p, -5, 0)) {
                socket.send({
                    type: "move",
                    pos: {
                        x: p.x - 5,
                        y: p.y,
                    },
                });
            }
        }

        if (p.direction.down) {
            if (!Mapper.collidesWithObject(p, 0, -5)) {
                socket.send({
                    type: "move",
                    pos: {
                        x: p.x,
                        y: p.y - 5,
                    },
                });
            }
        }

        if (p.direction.right) {
            if (!Mapper.collidesWithObject(p, 5, 0)) {
                socket.send({
                    type: "move",
                    pos: {
                        x: p.x + 5,
                        y: p.y,
                    },
                });
            }
        }
    }
}