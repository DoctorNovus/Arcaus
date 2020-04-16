"use strict";

function e(e) {
    return e && "object" == typeof e && "default" in e ? e.default : e;
}

var t = e(require("./node_modules/express")),
    s = e(require("path")),
    n = require("./node_modules/ws"),
    o = require("./node_modules/mongodb"),
    r = e(require("./node_modules/bcrypt")),
    a = e(require("./node_modules/body-parser")),
    i = e(require("fs")),
    l = e(require("./node_modules/bson")),
    u = e(require("./node_modules/nodemailer"));

/* imports */
/**
 * Website server
 * Mail server
 */
const d = t(),
    c = process.argv[2] || 3e3,
    m = u.createTransport({
        service: "gmail",
        auth: {
            user: "arcausgame@gmail.com",
            pass: "nviwqhceqxufwona"
        }
    });

d.use(t.static(s.join(__dirname, "/public"))), d.use(a.json()), d.use(a.urlencoded({
    extended: !0
})), d.get("*", (e, t) => {
    t.sendFile(s.resolve(__dirname, "public/index.html"));
}), d.listen(c, () => {
    console.log(`Server is now listening at ${c}`);
});

const p = new n.Server({
        port: 59072
    }),
    f = {};

// Variables for the server
let y = {};

// Settings HTML
// Loads our worlds
for (let e of i.readdirSync("worlds")) {
    let t = l.deserialize(i.readFileSync(`worlds/${e}`), "utf-8");
    y[e.substr(0, e.length - 5)] = t;
}

/**
 * 
 * @param {MongoDB collection} db database that you want to check
 * @param {String} email email that you are checking
 * @param {String} password password that you are checking
 * @param {callback} callback non-syncronous callback for after the database is checked
 */
function g(e, t, s, n) {
    // Makes sure there are no spaces
    t = t.trim().split(" ").join("");
    let o = {
        status: "",
        message: ""
    };
    /**
     * Checks if the accoutn exists, then breaks down into the following format:
     * if email:
     * - if pass is correct, make sure account is verified, else say it is not
     * else:
     * - create the account, and send a verification email
     */
    b(e, {
        email: t
    }, (a, i) => {
        if (a) throw a;
        null != i ?
            /**
             * Checks if the password is correct
             * @param {MongoDB collection} db collection to check
             * @param {JSON} user user to check
             * @param {CallableFunction} callback what to do afterwards
             */
            function(e, t, s) {
                b(e, {
                    email: t.email
                }, (e, n) => {
                    if (e) throw e;
                    null != n ? r.compare(t.password, n.password, (function(e, t) {
                        s(e, t);
                    })) : s(e, !1);
                });
            }
            /**
             * Returns a player from the database, but strips password for security purposes
             * @param {MongoDB collection} db collection to check
             * @param {JSON} query JSON query to find
             * @param {CallableFunction} callback what to do afterwards
             */
            (e, {
                email: t,
                password: s
            }, (e, t) => {
                if (e) throw e;
                i.verified ? t ? (o.status = "ok", o.message = "Logged in successfully!", n(o)) : (o.status = "Error",
                    o.message = "Incorrect credentials.", n(o)) : (o.status = "Error", o.message = "Account not verified",
                    n(o));
            }) :
            // Makes sure it is a valid email
            t.includes("@") && t.includes(".") ?
            /**
             * Uses bcrypt to hash and salt data
             * @param {String} password password to encrypt
             * @param {CallableFunction} callback what to do afterwards
             */
            function(e, t) {
                r.hash(e, 10, (function(e, s) {
                    t(e, s);
                }));
            }(s, (s, r) => {
                let a = k() + k();
                if (s) throw s;
                /**
                 * Creates a simple human into the database
                 */
                !
                /**
                 * Inserts into a collection certain JSON data
                 * @param {MongoDB collection} db database you want to insert into
                 * @param {*} data JSON to insert into the database
                 */
                function(e, t) {
                    e.insertOne(t, () => {});
                }
                /**
                 * Query what you need to find in a collection
                 * @param {MongoDB collection} db database you want to find info from
                 * @param {JSON} data JSON data to find
                 * @param {CallableFunction} callback what to do after you find data, if you do
                 */
                (e, {
                    email: t,
                    password: r,
                    inventory: {
                        cobble: 0
                    },
                    token: a,
                    username: null,
                    verified: !1
                });
                // Sends verification
                var i = {
                    from: "arcausgame@gmail.com",
                    to: t,
                    subject: "Arcaus Game Verification",
                    text: `\n                        Welcome to Arcaus! Before you can login, we are going to need you to login.\n                        Please verify your account using the following link:\n                        http://localhost:3000/verify/${a}\n                        `
                };
                m.sendMail(i, (function(e, t) {
                        e && console.log(e);
                    })), o.status = "Error", o.message = "Account created! Welcome to the game! Please verify your account and try again",
                    n(o);
            }) : (o.status = "Error", o.message = "Invalid email structure", n(o));
    });
}

/**
 * Send data to a websocket
 * @param {WebSocket} ws socket you want to send to
 * @param {JSON} data JSON that you want to send
 */
function w(e, t) {
    e.send(JSON.stringify(t));
}

/**
 * Sends data to all connected players
 * @param {JSON} data JSON you want to send
 */
function h(e) {
    for (let t in f) w(f[t].ws, e);
}

function b(e, t, s) {
    e.findOne(t, (e, t) => {
        s(e, t);
    });
}

/**
 * Creates a world with inputted text
 * @param {String} name name of the world
 */
function v(e) {
    let t = {
        name: e,
        owner: null
    };
    t.map =
        /**
         * Creates a map as a blank state for a world
         */
        function() {
            let e = [];
            for (let t = 0; t < 10; t++)
                for (let s = 0; s < 10; s++) e.push({
                    tile: "cobble",
                    type: "backdrop",
                    x: 96 * t,
                    y: 96 * s
                });
            return e;
        }
        /**
         * Returns a random token segment
         */
        (), y[e] = t, i.writeFileSync(`worlds/${e}.json`, l.serialize(t));
}

function k() {
    return Math.random().toString(36).substr(2);
    // remove `0.`
}

/**
 * Returns a full token
 */
o.MongoClient.connect("mongodb://localhost:27017/", (function(e, t) {
    if (e) throw e;
    let s = (t = t.db("arcaus")).collection("players");
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    d.post("/login", (e, t) => {
            g(s, e.body.email, e.body.password, e => {
                "ok" == e.status ? t.status(201).send({
                    socket: "ws://localhost:59072"
                }) : t.status(401).send({
                    reason: e.message
                });
            });
        }),
        /**
         * Token verification system that is given from email
         */
        d.post("/verify", (e, t) => {
            b(s, {
                token: e.body.token
            }, (t, n) => {
                if (t) throw t;
                if (null != n) {
                    n.verified = !0, s.updateOne({
                        token: e.body.token
                    }, {
                        $set: {
                            verified: !0
                        }
                    }, () => {});
                }
            });
        }), p.on("connection", e => {
            // Generates player websocket id
            e.id = Math.floor(999999999 * Math.random()), e.on("message", t => {
                    switch ((t = JSON.parse(t)).type) {
                        /**
                         * Connects the player so taht we may load them and collect their data
                         */
                        case "connect":
                            /**
                             * Checks the player connection database, and returns a status
                             */
                            g(s, t.email, t.password, n => {
                                "ok" == n.status ? (w(e, {
                                        type: "status",
                                        login: !0,
                                        message: n.message
                                    }),
                                    // Sets player id for their updating later
                                    w(e, {
                                        type: "setID",
                                        id: e.id
                                    }),
                                    /**
                                     * Sets our player into the game, and makes sure they have a username
                                     */
                                    function(e, t, s) {
                                        b(e, t, (e, t) => {
                                            if (e) throw e;
                                            null != t && (delete t.password, s(t));
                                        });
                                    }(s, {
                                        email: t.email
                                    }, t => {
                                        f[e.id] = t, f[e.id].id = e.id, f[e.id].x = 0, f[e.id].y = 0, f[e.id].ws = e, f[e.id].ready = !1,
                                            null == t.username ?
                                            /**
                                             * Sends the html code for the user to enter a username
                                             * 
                                             * Needs fixing for unique usernames
                                             */
                                            setTimeout(() => {
                                                w(e, {
                                                    type: "setUsername",
                                                    html: '\n                                            <form id="usernameSet" class="centeredForm">\n                                                <input id="username" placeholder="Input your username">\n                                                <button type="submit">Submit</button>\n                                            </form>\n                                        '
                                                });
                                            }) : f[e.id].username = t.username;
                                    })) : w(e, {
                                    type: "status",
                                    login: !1,
                                    message: n.message
                                });
                            });
                            break;

                            /**
                             * When user joins a world, load the players in it
                             * 
                             * Needs to be updated once the world update is out
                             */
                        case "loadPlayers":
                            f[e.id].ready = !0, h({
                                type: "setPlayers",
                                players: f
                            });
                            break;

                            /**
                             * When the player moves, send an update for that player to all clients in the game
                             */
                        case "move":
                            f[e.id].x = t.pos.x, f[e.id].y = t.pos.y, h({
                                type: "updatePlayer",
                                player: {
                                    id: e.id,
                                    x: t.pos.x,
                                    y: t.pos.y
                                }
                            });
                            break;

                            /**
                             * Load the world that the player wants, used for future purposes
                             */
                        case "loadWorld":
                            y[t.world] ? w(e, {
                                type: "setWorld",
                                world: y[t.world]
                            }) : w(e, {
                                type: "setWorld",
                                world: v(t.world)
                            });
                            break;

                            /**
                             * On a chat message, send it to all players with the user's username
                             */
                        case "chatMessage":
                            h({
                                type: "chatMessage",
                                message: `${f[e.id].username}: ${t.message}`
                            });
                            break;

                            /**
                             * When the user has no username, it is set here so that they may have one
                             */
                        case "setUser":
                            s.updateOne({
                                email: f[e.id].email
                            }, {
                                $set: {
                                    username: t.user
                                }
                            }, () => {}), f[e.id].username = t.user;
                            break;

                            /**
                             * When settings are requested, send setting html
                             */
                        case "loadSettings":
                            w(e, {
                                type: "settingScreen",
                                html: '\n    <div class="menu">\n        <h3 id="modifySettings"> Settings </h3>\n        <h3 id="switchWorld"> Switch World </h3>\n    </div>\n'
                            });
                            break;

                            /**
                             * When worlds are requested, send the code
                             */
                        case "loadWorlds":
                            w(e, {
                                type: "worldMenu",
                                html: '\n    <form class="menu">\n        <input id="worldSelect" placeholder=" Input world name " />\n        <button type="submit">Join</button>\n    </form>\n'
                            });
                    }
                }),
                /**
                 * When the player leaves, remove them from the game
                 */
                e.on("close", () => {
                    delete f[e.id], h({
                        type: "setPlayers",
                        players: f
                    });
                });
        });
}));