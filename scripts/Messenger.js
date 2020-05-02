import { DatabaseManager } from "./DatabaseManager"

export class Messenger {
    /**
     * Checks if the player email and pass are valid, and if so, send them the server
     */
    static login(app) {
        app.post("/login", (req, res) => {
            let body = "";

            req.on("data", function(chunk) {
                body += chunk;
            });

            req.on("end", function() {
                body = JSON.parse(body);
                DatabaseManager.connectToGame(db, body.email, body.password, response => {
                    if (response.status == "ok") {
                        res.writeHead(201, { "Content-Type": "application/json" });
                        res.write(JSON.stringify({
                            socket: "ws://localhost:59072"
                        }));
                        res.end();
                    } else {
                        res.writeHead(401, { "Content-Type": "application/json" });
                        res.write(JSON.stringify({
                            reason: response.message
                        }));
                        res.end();
                    }
                })
            });
        })
    }

    /**
     * Token verification system that is given from email
     */
    static verify(app) {
        app.post("/verify", (req, res) => {
            let body = "";

            req.on("data", function(chunk) {
                body += chunk;
            });

            req.on("end", function() {
                body = JSON.parse(body);
                DatabaseManager.find(db, { token: body.token }, (err, data1) => {
                    if (err) throw err;
                    if (data1 != null) {
                        DatabaseManager.find(db, { username: body.username }, (err, data) => {
                            if (data == null) {
                                if (data1.verified == false) {
                                    DatabaseManager.update(db, {
                                        token: body.token
                                    }, {
                                        verified: true,
                                        username: body.username
                                    });
                                    res.write(JSON.stringify({ status: "This username has been set" }));
                                    res.end();
                                } else {
                                    res.write(JSON.stringify({ status: "This account is already verified" }));
                                    res.end();
                                }
                            } else {
                                res.write(JSON.stringify({ status: "This username is taken." }));
                                res.end();
                            }
                        })
                    } else {}
                })
            })
        })
    }
}