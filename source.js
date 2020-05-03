/* imports */
import path from "path";
import fs from "fs";
import BSON from "bson";
import { Socket } from "./scripts/Socket";
import { DatabaseManager } from "./scripts/DatabaseManager";
import { Messenger } from "./scripts/Messenger";
import { SocketSwitch } from "./scripts/SocketSwitch";
import { DataGenerator } from "./scripts/DataGenerator";
import Server from "jolt-server";

/**
 * Website server
 * Mail server
 */
const port = process.argv[2] || 3000;
const url = "mongodb://localhost:27017/";
const app = Server({
    port: port,
    root: process.cwd() + "\\public",
    file: "index.html",
    live: true,
    spa: true
})

const socket = new Socket({ port: 59072 });

// Variables for the server
global.players = {};
global.worlds = {};

// Loads our worlds
for (let worldName of fs.readdirSync("worlds")) {
    let world = BSON.deserialize(fs.readFileSync(`worlds/${worldName}`), "utf-8")
    worlds[worldName.substr(0, worldName.length - 5)] = world;
}

DatabaseManager.connectToDB(url, "arcaus", "players", db => {
    global.db = db;
    Messenger.login(app);
    Messenger.verify(app);

    socket.on("connection", ws => {
        ws.id = DataGenerator.generateID(99999999999);
        ws.onmessage = (data) => {
            data = JSON.parse(data.data);
            switch (data.type) {
                /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                    /**
                     * Checks the player connection database, and returns a status
                     */
                    SocketSwitch.connect(db, data, ws);
                    break;

                    /**
                     * When user joins a world, load the players in it
                     * 
                     * Needs to be updated once the world update is out
                     */
                case "loadPlayers":
                    SocketSwitch.loadPlayers(ws);
                    break;

                    /**
                     * When the player moves, send an update for that player to all clients in the game
                     */
                case "move":
                    SocketSwitch.movePlayer(ws, data);
                    break;

                    /**
                     * Load the world that the player wants, used for future purposes
                     */
                case "loadWorld":
                    SocketSwitch.loadWorld(ws, data);
                    break;

                    /**
                     * On a chat message, send it to all players with the user's username
                     */
                case "chatMessage":
                    SocketSwitch.sendMessage(ws, data);
                    break;

                    /**
                     * When the user has no username, it is set here so that they may have one
                     */
                case "setUser":
                    SocketSwitch.setUsername(ws, data, db);
                    break;

                case "click":
                    SocketSwitch.click(ws, data);
                    break;

                case "getWorlds":
                    SocketSwitch.loadWorlds(ws);
                    break;
            }
        };

        /**
         * When the player leaves, remove them from the game
         */
        ws.onclose = _ => {
            delete players[ws.id];
            Socket.sendAll({
                type: "setPlayers",
                players: players
            })
        };
    });
});