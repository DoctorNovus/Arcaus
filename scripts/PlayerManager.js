import { DatabaseManager } from "./DatabaseManager";
import { Socket } from "./Socket";
import { WorldManager } from "./WorldManager";

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

            Socket.send(ws, {
                type: "setWorld",
                world: worlds["start"]
            });
        });
    }
}