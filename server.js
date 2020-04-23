"use strict";

function _interopDefault(e) {
    return e && "object" == typeof e && "default" in e ? e.default : e;
}

var e = _interopDefault(require("express")), a = _interopDefault(require("path")), s = _interopDefault(require("body-parser")), t = _interopDefault(require("fs")), r = _interopDefault(require("bson")), o = require("ws"), n = require("mongodb"), l = _interopDefault(require("bcrypt")), i = _interopDefault(require("nodemailer"));

class DataGenerator {
    static generateID(e) {
        return Math.floor(Math.random() * e);
    }
    /**
     * Returns a random token segment
     */    static generateRandomText() {
        return Math.random().toString(36).substr(2);
 // remove `0.`
        }
    /**
     * Returns a full token
     */
    static generateToken() {
        return DataGenerator.generateRandomText() + DataGenerator.generateRandomText();
 // to make it longer
        }
}

class Socket extends o.Server {
    constructor(e) {
        super(e);
    }
    /**
     * Send data to a websocket
     * @param {WebSocket} ws socket you want to send to
     * @param {Object} data JSON that you want to send
     */    static send(e, a) {
        e.send(JSON.stringify(a));
    }
    /**
     * Sends data to all connected players
     * @param {Object} data JSON you want to send
     */    static sendAll(e) {
        for (let a in players) Socket.send(players[a].ws, e);
    }
}

class Security {
    /**
     * Uses bcrypt to hash and salt data
     * @param {String} password password to encrypt
     * @param {Function} callback what to do afterwards
     */
    static EncryptPassword(e, a) {
        l.hash(e, 10, (e, s) => {
            a(e, s);
        });
    }
    /**
     * Checks if the password is correct
     * @param {} db collection to check
     * @param {Object} user user to check
     * @param {Function} callback what to do afterwards
     */    static CheckPassword(e, a, s) {
        DatabaseManager.find(e, {
            email: a.email
        }, (e, t) => {
            if (e) throw e;
            null != t ? l.compare(a.password, t.password, (e, a) => {
                s(e, a);
            }) : s(e, !1);
        });
    }
}

const c = i.createTransport({
    service: "gmail",
    auth: {
        user: "arcausgame@gmail.com",
        pass: "nviwqhceqxufwona"
    }
});

class DatabaseManager extends n.MongoClient {
    static connectToDB(e, a, s, t) {
        super.connect(e, (e, r) => {
            if (e) throw e;
            let o = (r = r.db(a)).collection(s);
            t(o);
        });
    }
    /**
     * 
     * @param {} db database that you want to check
     * @param {String} email email that you are checking
     * @param {String} password password that you are checking
     * @param {Function{ callback non-syncronous callback for after the database is checked
     */    static connectToGame(e, a, s, t) {
        // Makes sure there are no spaces
        a = a.trim().split(" ").join("");
        let r = {
            status: "",
            message: ""
        };
        /**
         * Checks if the accoutn exists, then breaks down into the following format:
         * if email:
         * - if pass is correct, make sure account is verified, else say it is not
         * else:
         * - create the account, and send a verification email
         */        DatabaseManager.find(e, {
            email: a
        }, (o, n) => {
            if (o) throw o;
            null != n ? Security.CheckPassword(e, {
                email: a,
                password: s
            }, (e, a) => {
                if (e) throw e;
                n.verified ? a ? (r.status = "ok", r.message = "Logged in successfully!", t(r)) : (r.status = "Error", 
                r.message = "Incorrect credentials.", t(r)) : (r.status = "Error", r.message = "Account not verified", 
                t(r));
            }) : 
            // Makes sure it is a valid email
            a.includes("@") && a.includes(".") ? Security.EncryptPassword(s, (s, o) => {
                let n = DataGenerator.generateToken();
                if (s) throw s;
                /**
                         * Creates a simple human into the database
                         */                DatabaseManager.insert(e, {
                    email: a,
                    password: o,
                    inventory: {
                        cobble: 0
                    },
                    token: n,
                    username: null,
                    verified: !1
                });
                // Sends verification
                var l = {
                    from: "arcausgame@gmail.com",
                    to: a,
                    subject: "Arcaus Game Verification",
                    text: `\n                        Welcome to Arcaus! Before you can login, we are going to need you to login.\n                        Please verify your account using the following link:\n                        http://localhost:3000/verify/${n}\n                        `
                };
                c.sendMail(l, (function(e, a) {
                    e && console.log(e);
                })), r.status = "Error", r.message = "Account created! Welcome to the game! Please verify your account and try again", 
                t(r);
            }) : (r.status = "Error", r.message = "Invalid email structure", t(r));
        });
    }
    /**
     * Inserts into a collection certain JSON data
     * @param {} db database you want to insert into
     * @param {*} data JSON to insert into the database
     */    static insert(e, a) {
        e.insertOne(a, () => {});
    }
    /**
     * Query what you need to find in a collection
     * @param {} db database you want to find info from
     * @param {Object} data JSON data to find
     * @param {Function} callback what to do after you find data, if you do
     */    static find(e, a, s) {
        e.findOne(a, (e, a) => {
            s(e, a);
        });
    }
    static update(e, a, s) {
        e.updateOne(a, {
            $set: s
        }, () => {});
    }
}

class Messenger {
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    static login(e, a) {
        e.post("/login", (e, s) => {
            DatabaseManager.connectToGame(a, e.body.email, e.body.password, e => {
                "ok" == e.status ? s.status(201).send({
                    socket: "ws://localhost:59072"
                }) : s.status(401).send({
                    reason: e.message
                });
            });
        });
    }
    /**
     * Token verification system that is given from email
     */    static verify(e, a) {
        e.post("/verify", (e, s) => {
            DatabaseManager.find(a, {
                token: e.body.token
            }, (t, r) => {
                if (t) throw t;
                null != r && DatabaseManager.find(a, {
                    username: e.body.username
                }, (t, o) => {
                    null == o ? 0 == r.verified ? (DatabaseManager.update(a, {
                        token: e.body.token
                    }, {
                        verified: !0,
                        username: e.body.username
                    }), s.send({
                        status: "This username has been set"
                    })) : s.send({
                        status: "This account is already verified"
                    }) : s.send({
                        status: "This username is taken."
                    });
                });
            });
        });
    }
}

class WorldManager {
    /**
     * Creates a world with inputted text
     * @param {String} name name of the world
     */
    static createWorld(e) {
        let a = {
            name: e,
            owner: null
        };
        return a.map = WorldManager.createMap(), worlds[e] = a, t.writeFileSync(`worlds/${e}.json`, r.serialize(a)), 
        a;
    }
    /**
     * Creates a map as a blank state for a world
     */    static createMap() {
        let e = [];
        for (let a = 0; a < 10; a++) for (let s = 0; s < 10; s++) e.push({
            tile: "cobble",
            type: "backdrop",
            x: 96 * a,
            y: 96 * s
        });
        return e;
    }
}

class PlayerManager {
    /**
     * Returns a player from the database, but strips password for security purposes
     * @param {} db collection to check
     * @param {Object} query JSON query to find
     * @param {Function} callback what to do afterwards
     */
    static getPlayer(e, a, s) {
        DatabaseManager.find(e, a, (e, a) => {
            if (e) throw e;
            null != a ? (delete a.password, s(a)) : s(a);
        });
    }
    static setDefaultPlayer(e, a, s, t) {
        PlayerManager.getPlayer(e, {
            email: a.email
        }, e => {
            players[s.id] = e, players[s.id].id = s.id, players[s.id].x = 0, players[s.id].y = 0, 
            players[s.id].ws = s, players[s.id].username = e.username, players[s.id].ready = !1, 
            Socket.send(s, {
                type: "status",
                login: !0,
                message: t.message
            }), Socket.send(s, {
                type: "setID",
                id: s.id
            }), worlds.start || WorldManager.createWorld("start"), Socket.send(s, {
                type: "setWorld",
                world: worlds.start
            });
        });
    }
}

class SocketSwitch {
    constructor() {}
    static connect(e, a, s) {
        DatabaseManager.connectToGame(e, a.email, a.password, t => {
            "ok" == t.status ? PlayerManager.setDefaultPlayer(e, a, s, t) : Socket.send(s, {
                type: "status",
                login: !1,
                message: t.message
            });
        });
    }
    static loadPlayers(e) {
        players[e.id].ready = !0, Socket.sendAll({
            type: "setPlayers",
            players
        });
    }
    static movePlayer(e, a) {
        players[e.id].x = a.pos.x, players[e.id].y = a.pos.y, Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: e.id,
                x: a.pos.x,
                y: a.pos.y
            }
        });
    }
    static loadWorld(e, a, s) {
        s[a.world] || WorldManager.createWorld(a.world), Socket.send(e, {
            type: "setWorld",
            world: s[a.world]
        });
    }
    static sendMessage(e, a) {
        Socket.sendAll({
            type: "chatMessage",
            message: `${players[e.id].username}: ${a.message}`
        });
    }
    static setUsername(e, a, s) {
        DatabaseManager.update(s, {
            email: players[e.id].email
        }, {
            username: a.user
        }), players[e.id].username = a.user;
    }
}

/* imports */
/**
 * Website server
 * Mail server
 */ const d = e(), u = process.argv[2] || 3e3;

d.use(e.static(a.join(__dirname, "/public"))), d.use(s.json()), d.use(s.urlencoded({
    extended: !0
})), d.get("*", (e, s) => {
    s.sendFile(a.resolve(__dirname, "public/index.html"));
}), d.listen(u, () => {
    console.log("Server is now listening at " + u);
});

const y = new Socket({
    port: 59072
});

// Variables for the server
global.players = {}, global.worlds = {};

// Loads our worlds
for (let e of t.readdirSync("worlds")) {
    let a = r.deserialize(t.readFileSync("worlds/" + e), "utf-8");
    worlds[e.substr(0, e.length - 5)] = a;
}

DatabaseManager.connectToDB("mongodb://localhost:27017/", "arcaus", "players", e => {
    Messenger.login(d, e), Messenger.verify(d, e), y.on("connection", a => {
        a.id = DataGenerator.generateID(99999999999), a.onmessage = s => {
            switch ((s = JSON.parse(s.data)).type) {
              /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                /**
                     * Checks the player connection database, and returns a status
                     */
                SocketSwitch.connect(e, s, a);
                break;

                /**
                     * When user joins a world, load the players in it
                     * 
                     * Needs to be updated once the world update is out
                     */              case "loadPlayers":
                SocketSwitch.loadPlayers(a);
                break;

                /**
                     * When the player moves, send an update for that player to all clients in the game
                     */              case "move":
                SocketSwitch.movePlayer(a, s);
                break;

                /**
                     * Load the world that the player wants, used for future purposes
                     */              case "loadWorld":
                SocketSwitch.loadWorld(a, s, worlds);
                break;

                /**
                     * On a chat message, send it to all players with the user's username
                     */              case "chatMessage":
                SocketSwitch.sendMessage(a, s);
                break;

                /**
                     * When the user has no username, it is set here so that they may have one
                     */              case "setUser":
                SocketSwitch.setUsername(a, s, e);
            }
        }, 
        /**
         * When the player leaves, remove them from the game
         */
        a.onclose = e => {
            delete players[a.id], Socket.sendAll({
                type: "setPlayers",
                players
            });
        };
    });
});
