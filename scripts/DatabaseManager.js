import { MongoClient } from "mongodb";
import { Security } from "./Security";
import { DataGenerator } from "./DataGenerator";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'arcausgame@gmail.com',
        pass: 'nviwqhceqxufwona'
    }
});

export class DatabaseManager extends MongoClient {
    static connectToDB(url, dbName, collectionName, callback) {
        super.connect(url, { useUnifiedTopology: true }, (err, db) => {
            if (err) throw err;

            db = db.db(dbName);
            let collection = db.collection(collectionName);

            callback(collection);
        });
    }

    /**
     * 
     * @param {} db database that you want to check
     * @param {String} email email that you are checking
     * @param {String} password password that you are checking
     * @param {Function{ callback non-syncronous callback for after the database is checked
     */
    static connectToGame(db, email, password, callback) {
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
        DatabaseManager.find(db, { email: email }, (err, dat2) => {
            if (err) throw err;
            if (dat2 != null) {
                Security.CheckPassword(db, { email: email, password: password }, (err, dat) => {
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
                    Security.EncryptPassword(password, (err, hash) => {
                        let toke = DataGenerator.generateToken();

                        if (err) throw err;

                        /**
                         * Creates a simple human into the database
                         */
                        DatabaseManager.insert(db, {
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
     * Inserts into a collection certain JSON data
     * @param {} db database you want to insert into
     * @param {*} data JSON to insert into the database
     */
    static insert(db, data) {
        db.insertOne(data, () => {});
    }

    /**
     * Query what you need to find in a collection
     * @param {} db database you want to find info from
     * @param {Object} data JSON data to find
     * @param {Function} callback what to do after you find data, if you do
     */
    static find(db, data, callback) {
        db.findOne(data, (err, dat) => {
            callback(err, dat);
        })
    }

    static update(db, query, setValue) {
        db.updateOne(query, {
            $set: setValue
        }, () => {

        })
    }
}