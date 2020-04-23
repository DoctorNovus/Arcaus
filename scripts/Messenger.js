import { DatabaseManager } from "./DatabaseManager"

export class Messenger {
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    static login(app, db) {
        app.post("/login", (req, res) => {
            DatabaseManager.connectToGame(db, req.body.email, req.body.password, response => {
                if (response.status == "ok") {
                    res.status(201).send({
                        socket: "ws://localhost:59072"
                    });
                } else {
                    res.status(401).send({
                        reason: response.message
                    })
                }
            })
        })
    }

    /**
     * Token verification system that is given from email
     */
    static verify(app, db) {
        app.post("/verify", (req, res) => {
            DatabaseManager.find(db, { token: req.body.token }, (err, data1) => {
                if (err) throw err;
                if (data1 != null) {
                    DatabaseManager.find(db, { username: req.body.username }, (err, data) => {
                        if (data == null) {
                            if (data1.verified == false) {
                                DatabaseManager.update(db, {
                                    token: req.body.token
                                }, {
                                    verified: true,
                                    username: req.body.username
                                });
                                res.send({ status: "This username has been set" })
                            } else {
                                res.send({ status: "This account is already verified" });
                            }
                        } else {
                            res.send({ status: "This username is taken." });
                        }
                    })
                } else {}
            })
        })
    }
}