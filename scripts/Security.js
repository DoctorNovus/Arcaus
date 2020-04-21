import { DatabaseManager } from "./DatabaseManager";
import bcrypt from "bcrypt";

const saltRounds = 10;

export class Security {
    /**
     * Uses bcrypt to hash and salt data
     * @param {String} password password to encrypt
     * @param {Function} callback what to do afterwards
     */
    static EncryptPassword(password, callback) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            callback(err, hash);
        });
    }

    /**
     * Checks if the password is correct
     * @param {} db collection to check
     * @param {Object} user user to check
     * @param {Function} callback what to do afterwards
     */
    static CheckPassword(db, user, callback) {
        DatabaseManager.find(db, { email: user.email }, (err, data) => {
            if (err) throw err;
            if (data != null) {
                bcrypt.compare(user.password, data.password, (err, result) => {
                    callback(err, result);
                });
            } else {
                callback(err, false);
            }
        });
    }
}