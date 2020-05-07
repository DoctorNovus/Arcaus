import { DatabaseManager } from "./DatabaseManager";
import { Socket } from "./Socket";
import { WorldManager } from "./WorldManager";
import { Rectangle } from "./Rectangle";

export class PlayerManager {
    /**
     * Returns a player from the database, but strips password for security purposes
     * @param {} db collection to check
     * @param {Object} query JSON query to find
     * @param {Function} callback what to do afterwards
     */
    static getPlayer(db, query, callback) {
        DatabaseManager.find(db, query, (err, data) => {
            if (err) throw err;
            if (data != null) {
                delete data.password;
                callback(data);
            } else {
                callback(data);
            }
        })
    }

    static setDefaultPlayer(db, data, ws, response) {
        PlayerManager.getPlayer(db, { email: data.email }, (data) => {
            players[ws.id] = data;
            players[ws.id].id = ws.id;
            players[ws.id].x = 0;
            players[ws.id].y = 0;
            players[ws.id].ws = ws;
            players[ws.id].username = data.username;
            players[ws.id].ready = false;
            players[ws.id].world = "start";
            players[ws.id].rect = new Rectangle(players[ws.id].x, players[ws.id].y, 96, 96);

            Socket.send(ws, {
                type: "status",
                login: true,
                message: response.message
            });

            Socket.send(ws, {
                type: "setID",
                id: ws.id
            });

            if (!worlds["start"]) {
                WorldManager.createWorld("start");
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

            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "setWorld",
                world: world
            });
        });
    }

    static applyGravity(ws) {
        for (let player of Object.values(players)) {
            let speed = Math.sqrt(((player.x + 5) - player.x) + ((player.y + 5) - player.y));
            if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y - speed / 2)) {
                player.y -= 1;
            }

            player.rect.setPosition(player.x, player.y);

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: player.x,
                    y: player.y
                }
            })
        }
    }
}