const express = require("express");
const app = express();
const port = process.argv[2] || 3000;
const path = require("path");
const WSS = require("ws").Server;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(express.static(path.join(__dirname, "/public")));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public/index.html"));
});

const server = app.listen(port, () => {
    console.log(`Server is now listening at ${port}`);
});

const wss = new WSS({ server: server });

const clients = {};
const players = {};

MongoClient.connect(url, function(err, db) {
    if (err) throw err;

    db = db.db("arcaus");
    let playerDB = db.collection("players");

    wss.on("connection", (ws) => {

        ws.on("open", () => {
            ws.id = Math.floor(Math.random() * 999999999);

            clients[ws.id] = ws;
        });

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
                        } else {
                            send(ws, {
                                "type": "status",
                                "login": false,
                                "message": response.message
                            });
                        }
                    });
                    break;
            }
        });

        ws.on("close", () => {
            delete clients[ws.id];
            delete players[ws.id];
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