"use strict";

function _interopDefault(e) {
    return e && "object" == typeof e && "default" in e ? e.default : e;
}

var e = _interopDefault(require("express")), a = _interopDefault(require("path")), t = _interopDefault(require("body-parser")), s = _interopDefault(require("fs")), r = _interopDefault(require("bson")), o = require("ws"), n = require("mongodb"), l = _interopDefault(require("bcrypt")), i = _interopDefault(require("nodemailer"));

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
        l.hash(e, 10, (e, t) => {
            a(e, t);
        });
    }
    /**
     * Checks if the password is correct
     * @param {} db collection to check
     * @param {Object} user user to check
     * @param {Function} callback what to do afterwards
     */    static CheckPassword(e, a, t) {
        DatabaseManager.find(e, {
            email: a.email
        }, (e, s) => {
            if (e) throw e;
            null != s ? l.compare(a.password, s.password, (e, a) => {
                t(e, a);
            }) : t(e, !1);
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
    static connectToDB(e, a, t, s) {
        super.connect(e, (e, r) => {
            if (e) throw e;
            let o = (r = r.db(a)).collection(t);
            s(o);
        });
    }
    /**
     * 
     * @param {} db database that you want to check
     * @param {String} email email that you are checking
     * @param {String} password password that you are checking
     * @param {Function{ callback non-syncronous callback for after the database is checked
     */    static connectToGame(e, a, t, s) {
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
                password: t
            }, (e, a) => {
                if (e) throw e;
                n.verified ? a ? (r.status = "ok", r.message = "Logged in successfully!", s(r)) : (r.status = "Error", 
                r.message = "Incorrect credentials.", s(r)) : (r.status = "Error", r.message = "Account not verified", 
                s(r));
            }) : 
            // Makes sure it is a valid email
            a.includes("@") && a.includes(".") ? Security.EncryptPassword(t, (t, o) => {
                let n = DataGenerator.generateToken();
                if (t) throw t;
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
                s(r);
            }) : (r.status = "Error", r.message = "Invalid email structure", s(r));
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
     */    static find(e, a, t) {
        e.findOne(a, (e, a) => {
            t(e, a);
        });
    }
    static update(e, a, t) {
        e.updateOne(a, {
            $set: t
        }, () => {});
    }
}

class Messenger {
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    static login(e, a) {
        e.post("/login", (e, t) => {
            DatabaseManager.connectToGame(a, e.body.email, e.body.password, e => {
                "ok" == e.status ? t.status(201).send({
                    socket: "ws://localhost:59072"
                }) : t.status(401).send({
                    reason: e.statusMessage
                });
            });
        });
    }
    /**
     * Token verification system that is given from email
     */    static verify(e, a) {
        e.post("/verify", (e, t) => {
            DatabaseManager.find(a, {
                token: e.body.token
            }, (t, s) => {
                if (t) throw t;
                if (null != s) {
                    s.verified = !0, DatabaseManager.update(a, {
                        token: e.body.token
                    }, {
                        verified: !0
                    });
                }
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
        return a.map = WorldManager.createMap(), worlds[e] = a, s.writeFileSync(`worlds/${e}.json`, r.serialize(a)), 
        a;
    }
    /**
     * Creates a map as a blank state for a world
     */    static createMap() {
        let e = [];
        for (let a = 0; a < 10; a++) for (let t = 0; t < 10; t++) e.push({
            tile: "cobble",
            type: "backdrop",
            x: 96 * a,
            y: 96 * t
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
    static getPlayer(e, a, t) {
        DatabaseManager.find(e, a, (e, a) => {
            if (e) throw e;
            null != a ? (delete a.password, t(a)) : t(a);
        });
    }
    static setDefaultPlayer(e, a, t, s) {
        PlayerManager.getPlayer(e, {
            email: a.email
        }, e => {
            players[t.id] = e, players[t.id].id = t.id, players[t.id].x = 0, players[t.id].y = 0, 
            players[t.id].ws = t, players[t.id].ready = !1, Socket.send(t, {
                type: "status",
                login: !0,
                message: s.message
            }), Socket.send(t, {
                type: "setID",
                id: t.id
            }), worlds.start || WorldManager.createWorld("start"), Socket.send(t, {
                type: "setWorld",
                world: worlds.start
            }), null == e.username ? 
            /**
                 * Sends the html code for the user to enter a username
                 * 
                 * Needs fixing for unique usernames
                 */
            setTimeout(() => {
                Socket.send(t, {
                    type: "setUsername",
                    html: '\n                        <form id="usernameSet" class="centeredForm">\n                            <input id="username" placeholder="Input your username">\n                            <button type="submit">Submit</button>\n                        </form>\n                    '
                }, 1e3);
            }) : players[t.id].username = e.username;
        });
    }
}

class SocketSwitch {
    constructor() {}
    static connect(e, a, t) {
        DatabaseManager.connectToGame(e, a.email, a.password, s => {
            "ok" == s.status ? PlayerManager.setDefaultPlayer(e, a, t, s) : Socket.send(t, {
                type: "status",
                login: !1,
                message: s.message
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
    static loadWorld(e, a, t) {
        t[a.world] || WorldManager.createWorld(a.world), Socket.send(e, {
            type: "setWorld",
            world: t[a.world]
        });
    }
    static sendMessage(e, a) {
        Socket.sendAll({
            type: "chatMessage",
            message: `${players[e.id].username}: ${a.message}`
        });
    }
    static setUsername(e, a, t) {
        DatabaseManager.update(t, {
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

d.use(e.static(a.join(__dirname, "/public"))), d.use(t.json()), d.use(t.urlencoded({
    extended: !0
})), d.get("*", (e, t) => {
    t.sendFile(a.resolve(__dirname, "public/index.html"));
}), d.listen(u, () => {
    console.log("Server is now listening at " + u);
});

const p = new Socket({
    port: 59072
});

// Variables for the server
global.players = {}, global.worlds = {};

// Loads our worlds
for (let e of s.readdirSync("worlds")) {
    let a = r.deserialize(s.readFileSync("worlds/" + e), "utf-8");
    worlds[e.substr(0, e.length - 5)] = a;
}

DatabaseManager.connectToDB("mongodb://localhost:27017/", "arcaus", "players", e => {
    Messenger.login(d, e), Messenger.verify(d, e), p.on("connection", a => {
        a.id = DataGenerator.generateID(99999999999), a.onmessage = t => {
            switch ((t = JSON.parse(t.data)).type) {
              /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                /**
                     * Checks the player connection database, and returns a status
                     */
                SocketSwitch.connect(e, t, a);
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
                SocketSwitch.movePlayer(a, t);
                break;

                /**
                     * Load the world that the player wants, used for future purposes
                     */              case "loadWorld":
                SocketSwitch.loadWorld(a, t, worlds);
                break;

                /**
                     * On a chat message, send it to all players with the user's username
                     */              case "chatMessage":
                SocketSwitch.sendMessage(a, t);
                break;

                /**
                     * When the user has no username, it is set here so that they may have one
                     */              case "setUser":
                SocketSwitch.setUsername(a, t, e);
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
