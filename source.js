/* imports */
import express from "express";
import path from "path";

import bodyParser from "body-parser";
import fs from "fs";
import BSON from "bson";
import { Socket } from "./scripts/Socket";
import { DatabaseManager } from "./scripts/DatabaseManager";
import { Messenger } from "./scripts/Messenger";
import { SocketSwitch } from "./scripts/SocketSwitch";
import { DataGenerator } from "./scripts/DataGenerator";

/**
 * Website server
 * Mail server
 */
const app = express();
const port = process.argv[2] || 3000;
const url = "mongodb://localhost:27017/";

app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public/index.html"));
});

app.listen(port, () => {
    console.log(`Server is now listening at ${port}`);
});

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
    Messenger.login(app, db);
    Messenger.verify(app, db);

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
                    SocketSwitch.loadWorld(ws, data, worlds);
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