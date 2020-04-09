const express = require("express");
const app = express();
const port = process.argv[2] || 3000;
const path = require("path");
const WSS = require("ws").Server;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const bcrypt = require('bcrypt');
const saltRounds = 10;
var bodyParser = require('body-parser');

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

const players = {};

MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    db = db.db("arcaus");
    let playerDB = db.collection("players");

    app.post("/login", (req, res) => {
        connect(playerDB, req.body.email, req.body.password, (response) => {
            if (response.status == "ok") {
                res.status(201).send({
                    socket: "ws://localhost:59072"
                });
            } else {
                res.status(401).send({
                    "reason": "Invalid Credentials"
                })
            }
        })
    })

    wss.on("connection", (ws) => {
        ws.id = Math.floor(Math.random() * 999999999);
        ws.on("message", (data) => {
            data = JSON.parse(data);
            switch (data.type) {
                case "connect":
                    connect(playerDB, data.email, data.password, (response) => {
                        if (response.status == "ok") {
                            send(ws, {
                                "type": "status",
                                "login": true,
                                "message": response.message
                            });

                            send(ws, {
                                type: "setID",
                                id: ws.id
                            });

                            getPlayer(playerDB, { email: data.email }, (data) => {
                                players[ws.id] = data;
                                players[ws.id].id = ws.id;
                                players[ws.id].x = 0;
                                players[ws.id].y = 0;
                                players[ws.id].ws = ws;
                                players[ws.id].ready = false;
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

                case "loadPlayers":
                    players[ws.id].ready = true;
                    sendAll({
                        type: "setPlayers",
                        players: players
                    })
                    break;

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
            }
        });

        ws.on("close", () => {
            delete players[ws.id];
            sendAll({
                type: "updatePlayers",
                players: players
            })
        });
    });
});

function connect(db, email, password, callback) {
    let response = {
        "status": "",
        "message": ""
    };

    find(db, { email: email }, (err, dat) => {
        if (err) throw err;
        if (dat != null) {
            CheckPassword(db, { email: email, password: password }, (err, dat) => {
                if (err) throw err;
                if (dat != false) {
                    response.status = "ok";
                    response.message = "Logged in successfully!";

                    callback(response);

                } else {
                    response.status = "Error";
                    response.message = "Incorrect credentials.";

                    callback(response);

                };
            });
        } else {
            EncryptPassword(password, (err, hash) => {

                if (err) throw err;

                insert(db, {
                    email: email,
                    password: hash
                });

                response.status = "ok";
                response.message = "Account created! Welcome to the game!";

                callback(response);
            })
        }
    })
}

function send(ws, data) {
    ws.send(JSON.stringify(data));
}

function sendAll(data) {
    for (let i in players) {
        send(players[i].ws, data);
    }
}

function insert(db, data) {
    db.insertOne(data, () => {});
}

function find(db, data, callback) {
    db.findOne(data, (err, dat) => {
        callback(err, dat);
    })
}

function EncryptPassword(password, callback) {
    bcrypt.hash(password, saltRounds, function(err, hash) {
        callback(err, hash);
    });
}

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

function getPlayer(db, query, callback) {
    find(db, query, (err, data) => {
        if (err) throw err;
        if (data != null) {
            delete data.password;
            callback(data);
        }
    })
}