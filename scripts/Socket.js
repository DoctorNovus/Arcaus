import { Server } from "ws";
import { DataGenerator } from "./DataGenerator";

export class Socket extends Server {
    constructor(config) {
        super(config);
    }

    /**
     * Send data to a websocket
     * @param {WebSocket} ws socket you want to send to
     * @param {Object} data JSON that you want to send
     */
    static send(ws, data) {
        ws.send(JSON.stringify(data));
    }

    /**
     * Sends data to all connected players
     * @param {Object} data JSON you want to send
     */
    static sendAll(data) {
        for (let i in players) {
            Socket.send(players[i].ws, data);
        }
    }

    static sendAllInWorld(world, data) {
        for (let i in players) {
            if (players[i].world == world) {
                Socket.send(players[i].ws, data);
            }
        }
    }
}