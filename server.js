"use strict";

function _interopDefault(e) {
    return e && "object" == typeof e && "default" in e ? e.default : e;
}

require("path");

var e = _interopDefault(require("fs")), t = _interopDefault(require("bson")), a = require("ws"), s = require("mongodb"), r = _interopDefault(require("bcrypt")), o = _interopDefault(require("nodemailer")), l = _interopDefault(require("jolt-server"));

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

class Socket extends a.Server {
    constructor(e) {
        super(e);
    }
    /**
     * Send data to a websocket
     * @param {WebSocket} ws socket you want to send to
     * @param {Object} data JSON that you want to send
     */    static send(e, t) {
        e.send(JSON.stringify(t));
    }
    /**
     * Sends data to all connected players
     * @param {Object} data JSON you want to send
     */    static sendAll(e) {
        for (let t in players) Socket.send(players[t].ws, e);
    }
    static sendAllInWorld(e, t) {
        for (let a in players) players[a].world == e && Socket.send(players[a].ws, t);
    }
}

class Security {
    /**
     * Uses bcrypt to hash and salt data
     * @param {String} password password to encrypt
     * @param {Function} callback what to do afterwards
     */
    static EncryptPassword(e, t) {
        r.hash(e, 10, (e, a) => {
            t(e, a);
        });
    }
    /**
     * Checks if the password is correct
     * @param {} db collection to check
     * @param {Object} user user to check
     * @param {Function} callback what to do afterwards
     */    static CheckPassword(e, t, a) {
        DatabaseManager.find(e, {
            email: t.email
        }, (e, s) => {
            if (e) throw e;
            null != s ? r.compare(t.password, s.password, (e, t) => {
                a(e, t);
            }) : a(e, !1);
        });
    }
}

const n = o.createTransport({
    service: "gmail",
    auth: {
        user: "arcausgame@gmail.com",
        pass: "nviwqhceqxufwona"
    }
});

class DatabaseManager extends s.MongoClient {
    static connectToDB(e, t, a, s) {
        super.connect(e, {
            useUnifiedTopology: !0
        }, (e, r) => {
            if (e) throw e;
            let o = (r = r.db(t)).collection(a);
            s(o);
        });
    }
    /**
     * 
     * @param {} db database that you want to check
     * @param {String} email email that you are checking
     * @param {String} password password that you are checking
     * @param {Function{ callback non-syncronous callback for after the database is checked
     */    static connectToGame(e, t, a, s) {
        // Makes sure there are no spaces
        t = t.trim().split(" ").join("");
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
            email: t
        }, (o, l) => {
            if (o) throw o;
            null != l ? Security.CheckPassword(e, {
                email: t,
                password: a
            }, (e, t) => {
                if (e) throw e;
                l.verified ? t ? (r.status = "ok", r.message = "Logged in successfully!", s(r)) : (r.status = "Error", 
                r.message = "Incorrect credentials.", s(r)) : (r.status = "Error", r.message = "Account not verified", 
                s(r));
            }) : 
            // Makes sure it is a valid email
            t.includes("@") && t.includes(".") ? Security.EncryptPassword(a, (a, o) => {
                let l = DataGenerator.generateToken();
                if (a) throw a;
                /**
                         * Creates a simple human into the database
                         */                DatabaseManager.insert(e, {
                    email: t,
                    password: o,
                    inventory: {
                        cobble: 0
                    },
                    token: l,
                    username: null,
                    verified: !1
                });
                // Sends verification
                var i = {
                    from: "arcausgame@gmail.com",
                    to: t,
                    subject: "Arcaus Game Verification",
                    text: `\n                        Welcome to Arcaus! Before you can login, we are going to need you to login.\n                        Please verify your account using the following link:\n                        http://localhost:3000/verify/${l}\n                        `
                };
                n.sendMail(i, (function(e, t) {
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
     */    static insert(e, t) {
        e.insertOne(t, () => {});
    }
    /**
     * Query what you need to find in a collection
     * @param {} db database you want to find info from
     * @param {Object} data JSON data to find
     * @param {Function} callback what to do after you find data, if you do
     */    static find(e, t, a) {
        e.findOne(t, (e, t) => {
            a(e, t);
        });
    }
    static update(e, t, a) {
        e.updateOne(t, {
            $set: a
        }, () => {});
    }
}

class Messenger {
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    static login(e) {
        e.post("/login", (e, t) => {
            let a = "";
            e.on("data", (function(e) {
                a += e;
            })), e.on("end", (function() {
                a = JSON.parse(a), DatabaseManager.connectToGame(db, a.email, a.password, e => {
                    "ok" == e.status ? (t.writeHead(201, {
                        "Content-Type": "application/json"
                    }), t.write(JSON.stringify({
                        socket: "ws://localhost:59072"
                    })), t.end()) : (t.writeHead(401, {
                        "Content-Type": "application/json"
                    }), t.write(JSON.stringify({
                        reason: e.message
                    })), t.end());
                });
            }));
        });
    }
    /**
     * Token verification system that is given from email
     */    static verify(e) {
        e.post("/verify", (e, t) => {
            let a = "";
            e.on("data", (function(e) {
                a += e;
            })), e.on("end", (function() {
                a = JSON.parse(a), DatabaseManager.find(db, {
                    token: a.token
                }, (e, s) => {
                    if (e) throw e;
                    null != s && DatabaseManager.find(db, {
                        username: a.username
                    }, (e, r) => {
                        null == r ? 0 == s.verified ? (DatabaseManager.update(db, {
                            token: a.token
                        }, {
                            verified: !0,
                            username: a.username
                        }), t.write(JSON.stringify({
                            status: "This username has been set"
                        })), t.end()) : (t.write(JSON.stringify({
                            status: "This account is already verified"
                        })), t.end()) : (t.write(JSON.stringify({
                            status: "This username is taken."
                        })), t.end());
                    });
                });
            }));
        });
    }
}

class WorldManager {
    /**
     * Creates a world with inputted text
     * @param {String} name name of the world
     */
    static createWorld(a) {
        let s = {
            name: a,
            owner: null
        };
        return s.map = WorldManager.createMap(), worlds[a] = s, e.writeFileSync(`worlds/${a}.json`, t.serialize(s)), 
        s;
    }
    static saveWorld(a) {
        e.writeFileSync(`worlds/${a}.json`, t.serialize(worlds[a]));
    }
    /**
     * Creates a map as a blank state for a world
     */    static createMap() {
        let e = [];
        for (let t = 0; t < 10; t++) for (let a = 0; a < 10; a++) e.push({
            tile: "dirt",
            type: "backdrop",
            x: 96 * t,
            y: 96 * a
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
    static getPlayer(e, t, a) {
        DatabaseManager.find(e, t, (e, t) => {
            if (e) throw e;
            null != t ? (delete t.password, a(t)) : a(t);
        });
    }
    static setDefaultPlayer(e, t, a, s) {
        PlayerManager.getPlayer(e, {
            email: t.email
        }, e => {
            players[a.id] = e, players[a.id].id = a.id, players[a.id].x = 0, players[a.id].y = 0, 
            players[a.id].ws = a, players[a.id].username = e.username, players[a.id].ready = !1, 
            players[a.id].world = "start", Socket.send(a, {
                type: "status",
                login: !0,
                message: s.message
            }), Socket.send(a, {
                type: "setID",
                id: a.id
            }), worlds.start || WorldManager.createWorld("start"), Socket.send(a, {
                type: "setWorld",
                world: worlds.start
            });
        });
    }
}

/** Rectangle Class */ class Rectangle {
    /**
     * @param {number} x - the x position
     * @param {number} y - the y position
     * @param {number} width - the rectangle width
     * @param {number} height - the rectangle height
     */
    constructor(e, t, a, s) {
        this.x = e, this.y = t, this.width = a, this.height = s, this.right = this.x + this.width, 
        this.bottom = this.y + this.height;
    }
    /**
         * set the rectangles position
         * @param {number} x - the new x position
         * @param {number} y - the new y position
         */    setPosition(e, t) {
        this.x = e, this.y = t;
    }
    /**
         * set the rectangles size
         * @param {number} width - the new rectangle width
         * @param {number} height - the new rectangle height
         */    setSize(e, t) {
        this.width = e, this.height = t;
    }
    /**
         * check if this rectangle overlaps another rectangle
         * @param {Rectangle} rect - the rectangle to check against
         * @return {boolean} - is this rectangle overlapping the rect
         */    overlaps(e) {
        return this.x < e.right && this.right > e.x && this.y < e.bottom && this.bottom > e.y;
    }
    /**
         * check if this rectangle is inside another rectangle
         * @param {Rectangle} rect - the rect to check against
         * @return {boolean} - is this rectangle inside the rect
         */    within(e) {
        return e.x >= this.x && e.right <= this.right && e.y <= this.y && e.bottom >= this.bottom;
    }
    /**
         * check if coordinates are inside this rectangle
         * @param {number} x - the x position to check
         * @param {number} y - the y position to check
         */    contains(e, t) {
        return e >= this.x && e <= this.right && t >= this.y && t <= this.bottom;
    }
}

class SocketSwitch {
    constructor() {}
    static connect(e, t, a) {
        DatabaseManager.connectToGame(e, t.email, t.password, s => {
            "ok" == s.status ? PlayerManager.setDefaultPlayer(e, t, a, s) : Socket.send(a, {
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
    static movePlayer(e, t) {
        let a = players[e.id], s = Math.sqrt(a.x + 5 - a.x + (a.y + 5 - a.y));
        switch (t.direction) {
          case "up":
            a.y += s;
            break;

          case "down":
            a.y -= s;
            break;

          case "left":
            a.x -= s;
            break;

          case "right":
            a.x += s;
        }
        Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: e.id,
                x: a.x,
                y: a.y
            }
        });
    }
    static loadWorld(e, t) {
        worlds[t.world] ? (players[e.id].world = t.world, Socket.send(e, {
            type: "setWorld",
            world: worlds[t.world]
        }), Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: e.id,
                world: t.world
            }
        })) : (WorldManager.createWorld(t.world), players[e.id].world = t.world, Socket.send(e, {
            type: "setWorld",
            world: worlds[t.world]
        }), Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: e.id,
                world: t.world
            }
        })), Socket.send(e, {
            type: "setWorlds",
            worlds
        });
    }
    static sendMessage(e, t) {
        Socket.sendAll({
            type: "chatMessage",
            message: `${players[e.id].username}: ${t.message}`
        });
    }
    static setUsername(e, t, a) {
        DatabaseManager.update(a, {
            email: players[e.id].email
        }, {
            username: t.user
        }), players[e.id].username = t.user;
    }
    static click(e, t) {
        let a = players[e.id], s = 96 * Math.floor(t.pos.x / 96), r = 96 * Math.floor(t.pos.y / 96), o = void 0;
        for (let e = 0; e < worlds[a.world].map.length; e++) {
            let t = worlds[a.world].map[e];
            null != t && t.x == s && t.y == r && (o = t);
        }
        let l = new Rectangle(s, r, 96, 96);
        if ("left" == t.button) {
            if (null != o) for (let e = 0; e < worlds[a.world].map.length; e++) {
                let t = worlds[a.world].map[e], s = new Rectangle(t.x, t.y, 96, 96);
                l.overlaps(s) && worlds[a.world].map.splice(e, 1);
            }
        } else "right" == t.button && null == o && worlds[a.world].map.push({
            tile: "cobble",
            type: "backdrop",
            x: s,
            y: r
        });
        Socket.sendAllInWorld(a.world, {
            type: "setWorld",
            world: worlds[a.world]
        });
    }
    static loadWorlds(e) {
        Socket.send(e, {
            type: "setWorlds",
            worlds
        });
    }
}

/* imports */
/**
 * Website server
 * Mail server
 */ const i = l({
    port: process.argv[2] || 3e3,
    root: process.cwd() + "\\public",
    file: "index.html",
    live: !0,
    spa: !0
}), d = new Socket({
    port: 59072
});

// Variables for the server
global.players = {}, global.worlds = {};

// Loads our worlds
for (let a of e.readdirSync("worlds")) {
    let s = t.deserialize(e.readFileSync("worlds/" + a), "utf-8");
    worlds[a.substr(0, a.length - 5)] = s;
}

setInterval(e => {
    for (let e = 0; e < worlds.length; e++) WorldManager.saveWorld(worlds[e].name);
    Socket.sendAll({
        type: "chatMessage",
        message: "[Announcement]: The game has been saved."
    });
}, 3e5), DatabaseManager.connectToDB("mongodb://localhost:27017/", "arcaus", "players", e => {
    global.db = e, Messenger.login(i), Messenger.verify(i), d.on("connection", t => {
        t.id = DataGenerator.generateID(99999999999), t.onmessage = a => {
            switch ((a = JSON.parse(a.data)).type) {
              /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                /**
                     * Checks the player connection database, and returns a status
                     */
                SocketSwitch.connect(e, a, t);
                break;

                /**
                     * When user joins a world, load the players in it
                     * 
                     * Needs to be updated once the world update is out
                     */              case "loadPlayers":
                SocketSwitch.loadPlayers(t);
                break;

                /**
                     * When the player moves, send an update for that player to all clients in the game
                     */              case "move":
                SocketSwitch.movePlayer(t, a);
                break;

                /**
                     * Load the world that the player wants, used for future purposes
                     */              case "loadWorld":
                SocketSwitch.loadWorld(t, a);
                break;

                /**
                     * On a chat message, send it to all players with the user's username
                     */              case "chatMessage":
                SocketSwitch.sendMessage(t, a);
                break;

                /**
                     * When the user has no username, it is set here so that they may have one
                     */              case "setUser":
                SocketSwitch.setUsername(t, a, e);
                break;

              case "click":
                SocketSwitch.click(t, a);
                break;

              case "getWorlds":
                SocketSwitch.loadWorlds(t);
            }
        }, 
        /**
         * When the player leaves, remove them from the game
         */
        t.onclose = e => {
            delete players[t.id], Socket.sendAll({
                type: "setPlayers",
                players
            });
        };
    });
});
