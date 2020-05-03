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
                player.y += speed;
                break;

            case "down":
                player.y -= speed;
                break;

            case "left":
                player.x -= speed;
                break;

            case "right":
                player.x += speed;
                break;
        }

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
        if (worlds[data.world]) {
            players[ws.id].world = data.world;

            Socket.send(ws, {
                type: "setWorld",
                world: worlds[data.world]
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
            players[ws.id].world = data.world;

            Socket.send(ws, {
                type: "setWorld",
                world: worlds[data.world]
            });

            Socket.sendAll({
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    world: data.world
                }
            });
        }

        Socket.send(ws, {
            type: "setWorlds",
            worlds: worlds
        });
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
                worlds[player.world].map.push({
                    tile: "cobble",
                    type: "backdrop",
                    x: x,
                    y: y
                });
            }
        }

        Socket.sendAllInWorld(player.world, {
            type: "setWorld",
            world: worlds[player.world]
        });
    }

    static loadWorlds(ws) {
        Socket.send(ws, {
            type: "setWorlds",
            worlds: worlds
        });
    }
}