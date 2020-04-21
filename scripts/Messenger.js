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
                        reason: response.statusMessage
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
            DatabaseManager.find(db, { token: req.body.token }, (err, data) => {
                if (err) throw err;
                if (data != null) {
                    let newData = data;
                    newData.verified = true;

                    DatabaseManager.update(db, {
                        token: req.body.token
                    }, {
                        verified: true
                    });
                } else {}
            })
        })
    }
}