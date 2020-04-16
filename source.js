/* imports */
import express from "express";
import path from "path";
import { Server as WSS } from "ws";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import fs from "fs";
import BSON from "bson";
import nodemailer from "nodemailer";

/**
 * Website server
 * Mail server
 */
const app = express();
const port = process.argv[2] || 3000;
const url = "mongodb://localhost:27017/";
const saltRounds = 10;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'arcausgame@gmail.com',
        pass: 'nviwqhceqxufwona'
    }
});

app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public/index.html"));
});

app.listen(port, () => {
    console.log(`Server is now listening at ${port}`);
});

const wss = new WSS({ port: 59072 });

// Variables for the server
const players = {};
let worlds = {};

// Settings HTML
const settingHTML = `
    <div class="menu">
        <h3 id="modifySettings"> Settings </h3>
        <h3 id="switchWorld"> Switch World </h3>
    </div>
`;

// World Menu HTML
const worldSwitch = `
    <form class="menu">
        <input id="worldSelect" placeholder=" Input world name " />
        <button type="submit">Join</button>
    </form>
`

// Loads our worlds
for (let worldName of fs.readdirSync("worlds")) {
    let world = BSON.deserialize(fs.readFileSync(`worlds/${worldName}`), "utf-8")
    worlds[worldName.substr(0, worldName.length - 5)] = world;
}

MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    db = db.db("arcaus");
    let playerDB = db.collection("players");

    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    app.post("/login", (req, res) => {
        connect(playerDB, req.body.email, req.body.password, (response) => {
            if (response.status == "ok") {
                res.status(201).send({
                    socket: "ws://localhost:59072"
                });
            } else {
                res.status(401).send({
                    "reason": response.message
                })
            }
        });
    });

    /**
     * Token verification system that is given from email
     */
    app.post("/verify", (req, res) => {
        find(playerDB, { token: req.body.token }, (err, data) => {
            if (err) throw err;
            if (data != null) {
                let newData = data;
                newData.verified = true;

                playerDB.updateOne({
                    token: req.body.token
                }, {
                    $set: {
                        verified: true
                    }
                }, () => {

                });
            } else {}
        })
    })

    wss.on("connection", (ws) => {
        // Generates player websocket id
        ws.id = Math.floor(Math.random() * 999999999);
        ws.on("message", (data) => {
            data = JSON.parse(data);
            switch (data.type) {
                /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                    /**
                     * Checks the player connection database, and returns a status
                     */
                    connect(playerDB, data.email, data.password, (response) => {
                        if (response.status == "ok") {
                            send(ws, {
                                "type": "status",
                                "login": true,
                                "message": response.message
                            });

                            // Sets player id for their updating later
                            send(ws, {
                                type: "setID",
                                id: ws.id
                            });

                            /**
                             * Sets our player into the game, and makes sure they have a username
                             */
                            getPlayer(playerDB, { email: data.email }, (data) => {
                                players[ws.id] = data;
                                players[ws.id].id = ws.id;
                                players[ws.id].x = 0;
                                players[ws.id].y = 0;
                                players[ws.id].ws = ws;
                                players[ws.id].ready = false;

                                if (data.username == (null || undefined)) {
                                    /**
                                     * Sends the html code for the user to enter a username
                                     * 
                                     * Needs fixing for unique usernames
                                     */
                                    setTimeout(() => {
                                        send(ws, {
                                            type: "setUsername",
                                            html: `
                                            <form id="usernameSet" class="centeredForm">
                                                <input id="username" placeholder="Input your username">
                                                <button type="submit">Submit</button>
                                            </form>
                                        `
                                        }, 1000);
                                    });
                                } else {
                                    players[ws.id].username = data.username;
                                }
                            });

                        } else {
                            send(ws, {
                                "type": "status",
                                "login": false,
                                "message": response.message
                            });
                        }
                    });
                    break;

                    /**
                     * When user joins a world, load the players in it
                     * 
                     * Needs to be updated once the world update is out
                     */
                case "loadPlayers":
                    players[ws.id].ready = true;
                    sendAll({
                        type: "setPlayers",
                        players: players
                    })
                    break;

                    /**
                     * When the player moves, send an update for that player to all clients in the game
                     */
                case "move":
                    players[ws.id].x = data.pos.x;
                    players[ws.id].y = data.pos.y;
                    sendAll({
                        type: "updatePlayer",
                        player: {
                            id: ws.id,
                            x: data.pos.x,
                            y: data.pos.y
                        }
                    });

                    break;

                    /**
                     * Load the world that the player wants, used for future purposes
                     */
                case "loadWorld":
                    if (worlds[data.world]) {
                        send(ws, {
                            type: "setWorld",
                            world: worlds[data.world]
                        });
                    } else {
                        send(ws, {
                            type: "setWorld",
                            world: createWorld(data.world)
                        });
                    }
                    break;


                    /**
                     * On a chat message, send it to all players with the user's username
                     */
                case "chatMessage":
                    sendAll({
                        type: "chatMessage",
                        message: `${players[ws.id].username}: ${data.message}`
                    });

                    break;

                    /**
                     * When the user has no username, it is set here so that they may have one
                     */
                case "setUser":
                    playerDB.updateOne({
                        email: players[ws.id].email
                    }, {
                        $set: {
                            username: data.user
                        }
                    }, () => {});
                    players[ws.id].username = data.user;
                    break;

                    /**
                     * When settings are requested, send setting html
                     */
                case "loadSettings":
                    send(ws, {
                        type: "settingScreen",
                        html: settingHTML
                    });
                    break;

                    /**
                     * When worlds are requested, send the code
                     */
                case "loadWorlds":
                    send(ws, {
                        type: "worldMenu",
                        html: worldSwitch
                    })
                    break;
            }
        });

        /**
         * When the player leaves, remove them from the game
         */
        ws.on("close", () => {
            delete players[ws.id];
            sendAll({
                type: "setPlayers",
                players: players
            })
        });
    });
});

/**
 * 
 * @param {MongoDB collection} db database that you want to check
 * @param {String} email email that you are checking
 * @param {String} password password that you are checking
 * @param {callback} callback non-syncronous callback for after the database is checked
 */
function connect(db, email, password, callback) {
    // Makes sure there are no spaces
    email = email.trim().split(" ").join("");

    let response = {
        "status": "",
        "message": ""
    };

    /**
     * Checks if the accoutn exists, then breaks down into the following format:
     * if email:
     * - if pass is correct, make sure account is verified, else say it is not
     * else:
     * - create the account, and send a verification email
     */
    find(db, { email: email }, (err, dat2) => {
        if (err) throw err;
        if (dat2 != null) {
            CheckPassword(db, { email: email, password: password }, (err, dat) => {
                if (err) throw err;
                if (dat2.verified) {
                    if (dat) {
                        response.status = "ok";
                        response.message = "Logged in successfully!";

                        callback(response);

                    } else {
                        response.status = "Error";
                        response.message = "Incorrect credentials.";

                        callback(response);
                    };
                } else {
                    response.status = "Error";
                    response.message = "Account not verified"

                    callback(response);
                }
            });
        } else {
            // Makes sure it is a valid email
            if (email.includes("@") && email.includes(".")) {
                EncryptPassword(password, (err, hash) => {
                    let toke = token();

                    if (err) throw err;

                    /**
                     * Creates a simple human into the database
                     */
                    insert(db, {
                        email: email,
                        password: hash,
                        inventory: {
                            "cobble": 0
                        },
                        token: toke,
                        username: null,
                        verified: false
                    });

                    // Sends verification
                    var mailOptions = {
                        from: 'arcausgame@gmail.com',
                        to: email,
                        subject: "Arcaus Game Verification",
                        text: `
                        Welcome to Arcaus! Before you can login, we are going to need you to login.
                        Please verify your account using the following link:
                        http://localhost:3000/verify/${toke}
                        `
                    };

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {

                        }
                    });

                    response.status = "Error";
                    response.message = "Account created! Welcome to the game! Please verify your account and try again";

                    callback(response);
                })

            } else {
                response.status = "Error";
                response.message = "Invalid email structure";

                callback(response);
            }
        }
    })
}

/**
 * Send data to a websocket
 * @param {WebSocket} ws socket you want to send to
 * @param {JSON} data JSON that you want to send
 */
function send(ws, data) {
    ws.send(JSON.stringify(data));
}

/**
 * Sends data to all connected players
 * @param {JSON} data JSON you want to send
 */
function sendAll(data) {
    for (let i in players) {
        send(players[i].ws, data);
    }
}

/**
 * Inserts into a collection certain JSON data
 * @param {MongoDB collection} db database you want to insert into
 * @param {*} data JSON to insert into the database
 */
function insert(db, data) {
    db.insertOne(data, () => {});
}

/**
 * Query what you need to find in a collection
 * @param {MongoDB collection} db database you want to find info from
 * @param {JSON} data JSON data to find
 * @param {CallableFunction} callback what to do after you find data, if you do
 */
function find(db, data, callback) {
    db.findOne(data, (err, dat) => {
        callback(err, dat);
    })
}

/**
 * Uses bcrypt to hash and salt data
 * @param {String} password password to encrypt
 * @param {CallableFunction} callback what to do afterwards
 */
function EncryptPassword(password, callback) {
    bcrypt.hash(password, saltRounds, function(err, hash) {
        callback(err, hash);
    });
}

/**
 * Checks if the password is correct
 * @param {MongoDB collection} db collection to check
 * @param {JSON} user user to check
 * @param {CallableFunction} callback what to do afterwards
 */
function CheckPassword(db, user, callback) {
    find(db, { email: user.email }, (err, data) => {
        if (err) throw err;
        if (data != null) {
            bcrypt.compare(user.password, data.password, function(err, result) {
                callback(err, result);
            });
        } else {
            callback(err, false);
        }
    });
}

/**
 * Returns a player from the database, but strips password for security purposes
 * @param {MongoDB collection} db collection to check
 * @param {JSON} query JSON query to find
 * @param {CallableFunction} callback what to do afterwards
 */
function getPlayer(db, query, callback) {
    find(db, query, (err, data) => {
        if (err) throw err;
        if (data != null) {
            delete data.password;
            callback(data);
        }
    })
}

/**
 * Creates a world with inputted text
 * @param {String} name name of the world
 */
function createWorld(name) {
    let world = {
        name: name
    };

    world.owner = null;
    world.map = createMap();

    worlds[name] = world;
    fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(world));
}

/**
 * Creates a map as a blank state for a world
 */
function createMap() {
    let map = [];

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            map.push({
                tile: "cobble",
                type: "backdrop",
                x: i * 96,
                y: j * 96
            });
        }
    }

    return map;
}

/**
 * Returns a random token segment
 */
function rand() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

/**
 * Returns a full token
 */
function token() {
    return rand() + rand(); // to make it longer
};