import { DatabaseManager } from "./DatabaseManager";
import { Socket } from "./Socket";
import { PlayerManager } from "./PlayerManager";

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
        players[ws.id].x = data.pos.x;
        players[ws.id].y = data.pos.y;
        Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: ws.id,
                x: data.pos.x,
                y: data.pos.y
            }
        });
    }

    static loadWorld(ws, data, worlds) {
        if (worlds[data.world]) {
            Socket.send(ws, {
                type: "setWorld",
                world: worlds[data.world]
            });
        } else {
            Socket.send(ws, {
                type: "setWorld",
                world: createWorld(data.world)
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
}