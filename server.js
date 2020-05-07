'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('path');
var fs = _interopDefault(require('fs'));
var BSON = _interopDefault(require('bson'));
var ws = require('ws');
var mongodb = require('mongodb');
var bcrypt = _interopDefault(require('bcrypt'));
var nodemailer = _interopDefault(require('nodemailer'));
var Server = _interopDefault(require('jolt-server'));

class DataGenerator {
    static generateID(count) {
        return Math.floor(Math.random() * count);
    }

    /**
     * Returns a random token segment
     */
    static generateRandomText() {
        return Math.random().toString(36).substr(2); // remove `0.`
    };

    /**
     * Returns a full token
     */
    static generateToken() {
        return DataGenerator.generateRandomText() + DataGenerator.generateRandomText(); // to make it longer
    };
}

class Socket extends ws.Server {
    constructor(config) {
        super(config);
    }

    /**
     * Send data to a websocket
     * @param {WebSocket} ws socket you want to send to
     * @param {Object} data JSON that you want to send
     */
    static send(ws, data) {
        ws.send(JSON.stringify(data));
    }

    /**
     * Sends data to all connected players
     * @param {Object} data JSON you want to send
     */
    static sendAll(data) {
        for (let i in players) {
            Socket.send(players[i].ws, data);
        }
    }

    static sendAllInWorld(world, data) {
        for (let i in players) {
            if (players[i].world == world) {
                Socket.send(players[i].ws, data);
            }
        }
    }
}

const saltRounds = 10;

class Security {
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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'arcausgame@gmail.com',
        pass: 'nviwqhceqxufwona'
    }
});

class DatabaseManager extends mongodb.MongoClient {
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
                        }                    } else {
                        response.status = "Error";
                        response.message = "Account not verified";

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
                            }
                        });

                        response.status = "Error";
                        response.message = "Account created! Welcome to the game! Please verify your account and try again";

                        callback(response);
                    });

                } else {
                    response.status = "Error";
                    response.message = "Invalid email structure";

                    callback(response);
                }
            }
        });
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
        });
    }

    static update(db, query, setValue) {
        db.updateOne(query, {
            $set: setValue
        }, () => {

        });
    }
}

class Messenger {
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
                });
            });
        });
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
                        });
                    }
                });
            });
        });
    }
}

/** Rectangle Class */
class Rectangle {
    /**
     * @param {number} x - the x position
     * @param {number} y - the y position
     * @param {number} width - the rectangle width
     * @param {number} height - the rectangle height
     */
    constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.right = this.x + this.width;
            this.bottom = this.y + this.height;
        }
        /**
         * set the rectangles position
         * @param {number} x - the new x position
         * @param {number} y - the new y position
         */
    setPosition(x, y) {
            this.x = x;
            this.y = y;
        }
        /**
         * set the rectangles size
         * @param {number} width - the new rectangle width
         * @param {number} height - the new rectangle height
         */
    setSize(width, height) {
            this.width = width;
            this.height = height;
        }
        /**
         * check if this rectangle overlaps another rectangle
         * @param {Rectangle} rect - the rectangle to check against
         * @return {boolean} - is this rectangle overlapping the rect
         */
    overlaps(rect) {
            return (
                this.x < rect.right &&
                this.right > rect.x &&
                this.y < rect.bottom &&
                this.bottom > rect.y
            );
        }
        /**
         * check if this rectangle is inside another rectangle
         * @param {Rectangle} rect - the rect to check against
         * @return {boolean} - is this rectangle inside the rect
         */
    within(rect) {
            return (
                rect.x >= this.x &&
                rect.right <= this.right &&
                rect.y <= this.y &&
                rect.bottom >= this.bottom
            );
        }
        /**
         * check if coordinates are inside this rectangle
         * @param {number} x - the x position to check
         * @param {number} y - the y position to check
         */
    contains(x, y) {
        return (
            x >= this.x &&
            x <= this.right &&
            y >= this.y &&
            y <= this.bottom
        );
    }
}

class Blueprint {
    constructor(name) {
        this.name = name;
        this.tiles = [];
        this.ids = {};
    }

    setTiles(tiles) {
        this.tiles = tiles;
    }

    setNameById(id, name) {
        this.ids[id] = name;
    }

    getNameById(id) {
        return this.ids[id];
    }

    convert(tiles) {
        let newTiles = [];

        for (let i = 0; i < this.tiles.length; i++) {
            let tileRow = this.tiles[i];
            for (let j = 0; j < tileRow.length; j++) {
                let tile = tileRow[j];
                if (tile != 0) {
                    newTiles.push({ name: this.getNameById(tile), x: j * 96, y: i * 96 });
                }
            }
        }

        return newTiles;
    }

    compile() {
        return this.convert(this._tiles)
    }
}

class Dungeon extends Blueprint {
    constructor() {
        super("dungeon");

        super.setNameById(1, "rock");

        super.setTiles([
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ]);
    }


}

class WorldManager {

    /**
     * Creates a world with inputted text
     * @param {String} name name of the world
     */
    static createWorld(name) {
        let world = {
            name: name
        };

        world.owner = null;
        world.map = WorldManager.createMap();
        world.count = 0;
        worlds[name] = world;
        fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(world));

        return world;
    }

    static saveWorld(name) {
        fs.writeFileSync(`worlds/${name}.json`, BSON.serialize(worlds[name]));
    }

    static collidesWithTile(world, x, y) {
        for (let tile of world.map) {
            let rect = new Rectangle(tile.x - 96 / 2, tile.y, 96, 96);
            if (rect.contains(x, y)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Creates a map as a blank state for a world
     */
    static createMap() {
        let map = [];

        let height = randBetween(50, 75);
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < height; j++) {
                let choice = randTwo(["dungeon", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", ]);
                if (choice == "cobble") {
                    let finds = map.map(m => ({ x: m.x, y: m.x }));
                    if (!finds.find(t => t.x == i * 96 && t.y == j * 96)) {
                        map.push({
                            tile: randTwo(["cobble", "cobble", "cobble", "cobble", "rock"]),
                            type: "backdrop",
                            x: i * 96,
                            y: j * 96
                        });
                    }
                } else {
                    let dung = new Dungeon();
                    if (dung.compile().length > 0) {
                        for (let tile of dung.compile()) {
                            map.push({
                                tile: tile.name,
                                type: "backdrop",
                                x: i * 96 + tile.x,
                                y: i * 96 + tile.y
                            });
                        }
                    }
                }
            }

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96
            });

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96 + 96
            });

            map.push({
                tile: "dirt",
                type: "backdrop",
                x: i * 96,
                y: height * 96 + 96 * 2
            });

            height += randBetween(-1, 1);
        }

        return map;
    }
}

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randTwo(arr) {
    return arr[randBetween(0, arr.length - 1)];
}

class PlayerManager {
    /**
     * Returns a player from the database, but strips password for security purposes
     * @param {} db collection to check
     * @param {Object} query JSON query to find
     * @param {Function} callback what to do afterwards
     */
    static getPlayer(db, query, callback) {
        DatabaseManager.find(db, query, (err, data) => {
            if (err) throw err;
            if (data != null) {
                delete data.password;
                callback(data);
            } else {
                callback(data);
            }
        });
    }

    static setDefaultPlayer(db, data, ws, response) {
        PlayerManager.getPlayer(db, { email: data.email }, (data) => {
            players[ws.id] = data;
            players[ws.id].id = ws.id;
            players[ws.id].x = 0;
            players[ws.id].y = 0;
            players[ws.id].ws = ws;
            players[ws.id].username = data.username;
            players[ws.id].ready = false;
            players[ws.id].world = "start";
            players[ws.id].rect = new Rectangle(players[ws.id].x, players[ws.id].y, 96, 96);

            Socket.send(ws, {
                type: "status",
                login: true,
                message: response.message
            });

            Socket.send(ws, {
                type: "setID",
                id: ws.id
            });

            if (!worlds["start"]) {
                WorldManager.createWorld("start");
            }

            let p = players[ws.id];
            let minX = p.x - 8 * 96;
            let maxX = p.x + 8 * 96;
            let minY = p.y - 5 * 96;
            let maxY = p.y + 5 * 96;
            let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

            let newmap = [];
            for (let i = 0; i < map.length; i++) {
                if (map[i] == true) {
                    newmap.push(worlds[p.world].map[i]);
                }
            }

            let world = JSON.parse(JSON.stringify(worlds[p.world]));

            world.map = newmap;

            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "setWorld",
                world: world
            });
        });
    }

    static applyGravity(ws) {
        for (let player of Object.values(players)) {
            let speed = Math.sqrt(((player.x + 5) - player.x) + ((player.y + 5) - player.y));
            if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y - speed / 2)) {
                player.y -= 1;
            }

            player.rect.setPosition(player.x, player.y);

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: player.x,
                    y: player.y
                }
            });
        }
    }
}

class SocketSwitch {
    constructor() {}

    static connect(db, data, ws) {
        DatabaseManager.connectToGame(db, data.email, data.password, (response) => {
            if (response.status == "ok") {
                PlayerManager.setDefaultPlayer(db, data, ws, response);
            } else {
                Socket.send(ws, {
                    type: "status",
                    login: false,
                    message: response.message
                });
            }
        });
    }

    static loadPlayers(ws) {
        players[ws.id].ready = true;
        Socket.sendAll({
            type: "setPlayers",
            players: players
        });
    }

    static movePlayer(ws, data) {
        let player = players[ws.id];
        let speed = Math.sqrt(((player.x + 5) - player.x) + ((player.y + 5) - player.y));
        switch (data.direction) {
            case "up":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y + speed * 2.5)) {
                    player.y += speed * 2.5;
                }
                break;

            case "down":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x, player.y - speed)) {
                    player.y -= speed;
                }
                break;

            case "left":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x - speed, player.y)) {
                    player.x -= speed;
                }
                break;

            case "right":
                if (!WorldManager.collidesWithTile(worlds[player.world], player.x + speed, player.y)) {
                    player.x += speed;
                }
                break;
        }

        player.rect.setPosition(player.x, player.y);

        Socket.sendAll({
            type: "updatePlayer",
            player: {
                id: ws.id,
                x: player.x,
                y: player.y
            }
        });
    }

    static loadWorld(ws, data) {
        try {
            worlds[players[ws.id].world].count--;
        } catch (err) {

        }

        if (worlds[data.world]) {
            if (Object.values(players).length > 0) {
                players[ws.id].world = data.world;
                worlds[data.world].count++;

                let p = players[ws.id];
                let minX = p.x - 8 * 96;
                let maxX = p.x + 8 * 96;
                let minY = p.y - 5 * 96;
                let maxY = p.y + 5 * 96;
                let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

                let newmap = [];
                for (let i = 0; i < map.length; i++) {
                    if (map[i] == true) {
                        newmap.push(worlds[p.world].map[i]);
                    }
                }

                let world = JSON.parse(JSON.stringify(worlds[p.world]));

                world.map = newmap;

                Socket.send(ws, {
                    type: "setWorld",
                    world: world
                });
            }

        } else {
            WorldManager.createWorld(data.world);
            if (Object.values(players).length > 0) {
                players[ws.id].world = data.world;
                worlds[data.world].count++;

                players[ws.id].world = data.world;
                worlds[data.world].count++;

                let p = players[ws.id];
                let minX = p.x - 8 * 96;
                let maxX = p.x + 8 * 96;
                let minY = p.y - 5 * 96;
                let maxY = p.y + 5 * 96;
                let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

                let newmap = [];
                for (let i = 0; i < map.length; i++) {
                    if (map[i] == true) {
                        newmap.push(worlds[p.world].map[i]);
                    }
                }

                let world = JSON.parse(JSON.stringify(worlds[p.world]));

                world.map = newmap;

                Socket.send(ws, {
                    type: "setWorld",
                    world: world
                });
            }
        }
    }

    static changeWorld(ws, data) {
        if (worlds[data.world]) {
            let p = players[ws.id];
            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            let minX = p.x - 8 * 96;
            let maxX = p.x + 8 * 96;
            let minY = p.y - 5 * 96;
            let maxY = p.y + 5 * 96;
            let map = worlds[data.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));
            let newmap = [];
            for (let i = 0; i < map.length; i++) {
                if (map[i] == true) {
                    newmap.push(worlds[data.world].map[i]);
                }
            }

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.sendAll({
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    world: data.world
                }
            });
        } else {
            WorldManager.createWorld(data.world);
            let p = players[ws.id];
            p.x = worlds[data.world].map[worlds[data.world].map.length - 1].x;
            p.y = worlds[data.world].map[worlds[data.world].map.length - 1].y + 96;
            p.rect.x = p.x;
            p.rect.y = p.y;

            let minX = p.x - 8 * 96;
            let maxX = p.x + 8 * 96;
            let minY = p.y - 5 * 96;
            let maxY = p.y + 5 * 96;
            let map = worlds[data.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));
            let newmap = [];
            for (let i = 0; i < map.length; i++) {
                if (map[i] == true) {
                    newmap.push(worlds[data.world].map[i]);
                }
            }

            Socket.send(ws, {
                type: "setWorld",
                world: newmap
            });

            Socket.send(ws, {
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    x: p.x,
                    y: p.y
                }
            });

            Socket.sendAll({
                type: "updatePlayer",
                player: {
                    id: ws.id,
                    world: data.world
                }
            });
        }
    }

    static sendMessage(ws, data) {
        Socket.sendAll({
            type: "chatMessage",
            message: `${players[ws.id].username}: ${data.message}`
        });
    }

    static setUsername(ws, data, db) {
        DatabaseManager.update(db, {
            email: players[ws.id].email
        }, {
            username: data.user
        });
        players[ws.id].username = data.user;
    }

    static click(ws, data) {
        let player = players[ws.id];
        let x = (Math.floor(data.pos.x / 96) * 96);
        let y = (Math.floor(data.pos.y / 96) * 96);

        let tile = undefined;

        for (let i = 0; i < worlds[player.world].map.length; i++) {
            let mapTile = worlds[player.world].map[i];
            if (mapTile != undefined) {
                if (mapTile.x == x && mapTile.y == y) {
                    tile = mapTile;
                }
            }
        }

        let rect = new Rectangle(x, y, 96, 96);

        if (data.button == "left") {
            if (tile != undefined) {
                for (let i = 0; i < worlds[player.world].map.length; i++) {
                    let mapTile = worlds[player.world].map[i];
                    let rect2 = new Rectangle(mapTile.x, mapTile.y, 96, 96);
                    if (rect.overlaps(rect2)) {
                        worlds[player.world].map.splice(i, 1);
                    }
                }
            }
        } else if (data.button == "right") {
            if (tile == undefined) {
                if (!rect.overlaps(player.rect)) {
                    worlds[player.world].map.push({
                        tile: data.item,
                        type: "backdrop",
                        x: x,
                        y: y
                    });
                }
            }
        }

        let p = players[ws.id];
        let minX = p.x - 8 * 96;
        let maxX = p.x + 8 * 96;
        let minY = p.y - 5 * 96;
        let maxY = p.y + 5 * 96;
        let map = worlds[p.world].map.map(sector => (sector.x > minX && sector.x < maxX) && (sector.y > minY && sector.y < maxY));

        let newmap = [];
        for (let i = 0; i < map.length; i++) {
            if (map[i] == true) {
                newmap.push(worlds[p.world].map[i]);
            }
        }

        let world = JSON.parse(JSON.stringify(worlds[p.world]));

        world.map = newmap;

        Socket.send(ws, {
            type: "setWorld",
            world: world
        });

    }

    static loadWorlds(ws) {
        Socket.send(ws, {
            type: "setWorlds",
            worlds: worlds
        });
    }
}

/* imports */

/**
 * Website server
 * Mail server
 */
const port = process.argv[2] || 3000;
const url = "mongodb://localhost:27017/";
const app = Server({
    port: port,
    root: process.cwd() + "\\public",
    file: "index.html",
    live: true,
    spa: true
});

const socket = new Socket({ port: 59072 });

// Variables for the server
global.players = {};
global.worlds = {};

// Loads our worlds
for (let worldName of fs.readdirSync("worlds")) {
    let world = BSON.deserialize(fs.readFileSync(`worlds/${worldName}`), "utf-8");
    world.count = 0;
    worlds[worldName.substr(0, worldName.length - 5)] = world;
}

setInterval(_ => {
    for (let i = 0; i < worlds.length; i++) {
        WorldManager.saveWorld(worlds[i].name);
    }

    Socket.sendAll({
        type: "chatMessage",
        message: `[Announcement]: The game has been saved.`
    });

}, 300000);

DatabaseManager.connectToDB(url, "arcaus", "players", db => {
    global.db = db;
    Messenger.login(app);
    Messenger.verify(app);

    socket.on("connection", ws => {
        ws.id = DataGenerator.generateID(99999999999);
        setInterval(_ => {
            PlayerManager.applyGravity(ws);
        }, 10);
        ws.onmessage = (data) => {
            data = JSON.parse(data.data);
            switch (data.type) {
                /**
                 * Connects the player so taht we may load them and collect their data
                 */
                case "connect":
                    /**
                     * Checks the player connection database, and returns a status
                     */
                    SocketSwitch.connect(db, data, ws);
                    break;

                    /**
                     * When user joins a world, load the players in it
                     * 
                     * Needs to be updated once the world update is out
                     */
                case "loadPlayers":
                    SocketSwitch.loadPlayers(ws);
                    break;

                    /**
                     * When the player moves, send an update for that player to all clients in the game
                     */
                case "move":
                    SocketSwitch.movePlayer(ws, data);
                    break;

                    /**
                     * Load the world that the player wants, used for future purposes
                     */
                case "loadWorld":
                    SocketSwitch.loadWorld(ws, data);
                    break;

                    /**
                     * On a chat message, send it to all players with the user's username
                     */
                case "chatMessage":
                    SocketSwitch.sendMessage(ws, data);
                    break;

                    /**
                     * When the user has no username, it is set here so that they may have one
                     */
                case "setUser":
                    SocketSwitch.setUsername(ws, data, db);
                    break;

                case "click":
                    SocketSwitch.click(ws, data);
                    break;

                case "getWorlds":
                    SocketSwitch.loadWorlds(ws);
                    break;

                case "changeWorld":
                    SocketSwitch.changeWorld(ws, data);
                    break;
            }
        };

        /**
         * When the player leaves, remove them from the game
         */
        ws.onclose = _ => {
            delete players[ws.id];
            Socket.sendAll({
                type: "setPlayers",
                players: players
            });
        };
    });
});
