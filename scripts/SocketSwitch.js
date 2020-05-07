import { DatabaseManager } from "./DatabaseManager";
import { Socket } from "./Socket";
import { PlayerManager } from "./PlayerManager";
import { WorldManager } from "./WorldManager";
import { Rectangle } from "./Rectangle";

export class SocketSwitch {
    constructor() {}

    static connect(db, data, ws) {
        DatabaseManager.connectToGame(db, data.email, data.password, (response) => {
            if (response.status == "ok") {
                PlayerManager.setDefaultPlayer(db, data, ws, response);
            } else {
                Socket.send(ws, {
                    type: "status",
                    login: false,
                    message: response.message
                });
            }
        })
    }

    static loadPlayers(ws) {
        players[ws.id].ready = true;
        Socket.sendAll({
            type: "setPlayers",
            players: players
        })
    }

    static movePlayer(ws, data) {
        let player = players[ws.id];
        let speed = Math.sqrt(((player.x + 5) - player.x) + ((player.y + 5) - player.y));
        switch (data.direction) {
            case "up":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y + speed * 2.5)) {
                    player.y += speed * 2.5;
                }
                break;

            case "down":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y - speed)) {
                    player.y -= speed;
                }
                break;

            case "left":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x - speed, player.y)) {
                    player.x -= speed;
                }
                break;

            case "right":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x + speed, player.y)) {
                    player.x += speed;
                }
                break;
        }

        player.rect.setPosition(player.x, player.y);

        Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: ws.id,
                x: player.x,
                y: player.y
            }
        });
    }

    static loadWorld(ws, data) {
        try {
            worlds[players[ws.id].world].count--;
        } catch (err) {

        }

        if (worlds[data.world]) {
            if (Object.values(players).length > 0) {
                players[ws.id].world = data.world;
                worlds[data.world].count++;

                let p = players[ws.id];
                let minX = p.x - 8 * 96;
                let maxX = p.x + 8 * 96;
                let minY = p.y - 5 * 96;
                let maxY = p.y + 5 * 96;
                let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

                let newmap = [];
                for (let i = 0; i < map.length; i++) {
                    if (map[i] == true) {
                        newmap.push(worlds[p.world].map[i]);
                    }
                }

                let world = JSON.parse(JSON.stringify(worlds[p.world]));

                world.map = newmap;

                Socket.send(ws, {
                    type: "setWorld",
                    world: world
                });
            }

        } else {
            WorldManager.createWorld(data.world)
            if (Object.values(players).length > 0) {
                players[ws.id].world = data.world;
                worlds[data.world].count++;

                players[ws.id].world = data.world;
                worlds[data.world].count++;

                let p = players[ws.id];
                let minX = p.x - 8 * 96;
                let maxX = p.x + 8 * 96;
                let minY = p.y - 5 * 96;
                let maxY = p.y + 5 * 96;
                let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

                let newmap = [];
                for (let i = 0; i < map.length; i++) {
                    if (map[i] == true) {
                        newmap.push(worlds[p.world].map[i]);
                    }
                }

                let world = JSON.parse(JSON.stringify(worlds[p.world]));

                world.map = newmap;

                Socket.send(ws, {
                    type: "setWorld",
                    world: world
                });
            }
        }
    }

    static changeWorld(ws, data) {
        if (worlds[data.world]) {
            let p = players[ws.id];
            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            let minX = p.x - 8 * 96;
            let maxX = p.x + 8 * 96;
            let minY = p.y - 5 * 96;
            let maxY = p.y + 5 * 96;
            let map = worlds[data.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));
            let newmap = [];
            for (let i = 0; i < map.length; i++) {
                if (map[i] == true) {
                    newmap.push(worlds[data.world].map[i]);
                }
            }

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.sendAll({
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    world: data.world
                }
            });
        } else {
            WorldManager.createWorld(data.world)
            let p = players[ws.id];
            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            let minX = p.x - 8 * 96;
            let maxX = p.x + 8 * 96;
            let minY = p.y - 5 * 96;
            let maxY = p.y + 5 * 96;
            let map = worlds[data.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));
            let newmap = [];
            for (let i = 0; i < map.length; i++) {
                if (map[i] == true) {
                    newmap.push(worlds[data.world].map[i]);
                }
            }

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.sendAll({
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    world: data.world
                }
            });
        }
    }

    static sendMessage(ws, data) {
        Socket.sendAll({
            type: "chatMessage",
            message: `${players[ws.id].username}: ${data.message}`
        });
    }

    static setUsername(ws, data, db) {
        DatabaseManager.update(db, {
            email: players[ws.id].email
        }, {
            username: data.user
        });
        players[ws.id].username = data.user;
    }

    static click(ws, data) {
        let player = players[ws.id];
        let x = (Math.floor(data.pos.x / 96) * 96);
        let y = (Math.floor(data.pos.y / 96) * 96);

        let tile = undefined;

        for (let i = 0; i < worlds[player.world].map.length; i++) {
            let mapTile = worlds[player.world].map[i];
            if (mapTile != undefined) {
                if (mapTile.x == x && mapTile.y == y) {
                    tile = mapTile;
                }
            }
        }

        let rect = new Rectangle(x, y, 96, 96);

        if (data.button == "left") {
            if (tile != undefined) {
                for (let i = 0; i < worlds[player.world].map.length; i++) {
                    let mapTile = worlds[player.world].map[i];
                    let rect2 = new Rectangle(mapTile.x, mapTile.y, 96, 96);
                    if (rect.overlaps(rect2)) {
                        worlds[player.world].map.splice(i, 1);
                    }
                }
            }
        } else if (data.button == "right") {
            if (tile == undefined) {
                if (!rect.overlaps(player.rect)) {
                    worlds[player.world].map.push({
                        tile: data.item,
                        type: "backdrop",
                        x: x,
                        y: y
                    });
                }
            }
        }

        let p = players[ws.id];
        let minX = p.x - 8 * 96;
        let maxX = p.x + 8 * 96;
        let minY = p.y - 5 * 96;
        let maxY = p.y + 5 * 96;
        let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

        let newmap = [];
        for (let i = 0; i < map.length; i++) {
            if (map[i] == true) {
                newmap.push(worlds[p.world].map[i]);
            }
        }

        let world = JSON.parse(JSON.stringify(worlds[p.world]));

        world.map = newmap;

        Socket.send(ws, {
            type: "setWorld",
            world: world
        });

    }

    static loadWorlds(ws) {
        Socket.send(ws, {
            type: "setWorlds",
            worlds: worlds
        });
    }
}