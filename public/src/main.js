/* imports */
import { Router, View, request } from "jolt";

import {
    Screen,
    Display,
    Device,
    Loader,
    Animation,
    Camera,
    Texture,
    Rectangle,
} from "@outwalk/skylark";

import { Player } from "./Player";
import { Sector } from "./Sector";

/* variables for the game */

let ws;
let email;

window.game = {
    animations: {},
    assets: {},
    materials: {},
    players: [],
};

let playerID;

let up = false;
let down = false;
let left = false;
let right = false;

/* Views for the game */

/**
 * The main menu, to await the login of the user
 */
class MainMenu extends View {
    load() {
        super.addStyle(`
            html,
            body{
                overflow: hidden;
                width: 100%;
                height: 100%;
                background-color: black;
            }

            form{
                display: flex;
                flex-direction: column;
                width: 50%;
                margin: auto;
                height: 50%;
                position: absolute;
                top: 45%;
                left: 25%;
                color: white;
            }

            .menu{
                display: flex;
                flex-direction: column;
                width: 50%;
                margin: auto;
                height: 50%;
                position: absolute;
                top: 45%;
                left: 25%;
                color: white;
            }

            form *{
                background-color: transparent;
                height: 10%;
                color: white;
            }

            #status{
                width: 100%;
                height: auto;
            }

            #background{
                width: 100%;
                height: 10%;
                margin: auto;
            }

            #chat{
                color: white;
                position: absolute;
                bottom: 2.5%;
                left: 5%;
                height: 30%;
                width: 35%;
                background-color: rgba(240, 248, 255, 0.05);
                overflow-x: none;
                overfly-y: scroll;
            }

            #chatMessage{
                height: 2.5%;
                position: absolute;
                left: 5%;
                bottom: 0%;
                width: 35%;
                background-color: rgba(240, 248, 255, 0.05);
                overflow-x: scroll;
                overflow-y: none;
                color: white;
            }
        `);
    }

    render() {
        return `
            <img src="assets/logo.png" id="background">
            <form id="login">
                <input id="email" type="email" placeholder="Email" />
                <input id="password" type="password" placeholder="Password" />
                <button type="submit">Connect</button>
                <h2 id="status"></h2>
            </form>
        `;
    }

    /**
     * Sends a request to the login segment of the server to login, and if valid, connects to the websocket server
     */
    didLoad() {
        document.getElementById("login").onsubmit = (e) => {
            e.preventDefault();

            request
                .post("/login", {
                    email: document.getElementById("email").value.toLowerCase(),
                    password: document.getElementById("password").value,
                })
                .then((response) => {
                    if (response.statusCode == 201) {
                        // Connects to the websocket if things worked out well

                        ws = new WebSocket(response.data.socket);

                        /**
                         * Just making sure we are connected
                         *
                         * Make it so that we don't need this anymore
                         */
                        ws.onopen = () => {
                            send({
                                type: "connect",
                                email: document.getElementById("email").value.toLowerCase(),
                                password: document.getElementById("password").value,
                            });

                            email = document.getElementById("email").value.toLowerCase();
                        };

                        /**
                         * Our entire relay between server and client
                         */
                        ws.onmessage = (data) => {
                            data = JSON.parse(data.data);

                            switch (data.type) {
                                /**
                                 * Login status for the game
                                 */
                                case "status":
                                    document.getElementById("status").innerText = data.message;

                                    /**
                                     * If logged in, then allow to relay the chat into the game, and load the game
                                     */
                                    if (data.login) {
                                        setTimeout(() => {
                                            document.getElementById("app").innerHTML = "";
                                            Screen.setScreen(new Game());
                                            let chat = document.createElement("div");
                                            let sender = document.createElement("input");
                                            sender.id = "chatMessage";
                                            chat.id = "chat";
                                            chat.scrollTop = chat.scrollHeight;
                                            document.getElementById("app").appendChild(chat);
                                            document.getElementById("app").appendChild(sender);
                                        });
                                    }

                                    break;

                                    /**
                                     * opens the gui and requests the username, then sends it
                                     */
                                case "setUsername":
                                    let create = document.createElement("div");
                                    create.innerHTML = data.html;
                                    document.getElementById("app").appendChild(create);

                                    document.getElementById("usernameSet").onsubmit = (e) => {
                                        e.preventDefault();
                                        x;
                                        send({
                                            type: "setUser",
                                            user: document.getElementById("username").value,
                                        });
                                        document
                                            .getElementById("app")
                                            .removeChild(document.getElementById("usernameSet"));
                                    };
                                    break;

                                    /**
                                     * Sets our world
                                     *
                                     * update this to work with the worlds update
                                     */
                                case "setWorld":
                                    game.world = data.world;
                                    break;

                                    /**
                                     * Sets all players in the world for the current user, but only runs this on world join
                                     *
                                     * Make sure to have this work everytime the user joins a world (worlds update)
                                     */
                                case "setPlayers":
                                    game.players = [];
                                    for (let i in data.players) {
                                        let p = data.players[i];
                                        let player = new Player(
                                            p.x,
                                            p.y,
                                            32,
                                            32,
                                            game.animations["base_idle_right"]
                                        );
                                        player.id = p.id;
                                        game.players.push(player);
                                    }
                                    break;

                                    /**
                                     * find the player in all the players, and update the position of that player
                                     */
                                case "updatePlayer":
                                    let player = game.players.find((p) => p.id == data.player.id);
                                    player.move(data.player.x, data.player.y);
                                    break;

                                    /**
                                     * Sets the player ID
                                     */
                                case "setID":
                                    playerID = data.id;
                                    break;

                                    /**
                                     * When a chat message is sent, add that message to the text of the chat element
                                     */
                                case "chatMessage":
                                    let chat = document.getElementById("chat");
                                    chat.innerText += `${data.message}\r\n`;
                                    break;

                                    /**
                                     * Settings screen to exit world, change volume, and reset password
                                     *
                                     * WIP
                                     */
                                case "settingScreen":
                                    let div = document.createElement("div");
                                    div.id = "settings";
                                    div.innerHTML = data.html;
                                    document.getElementById("app").appendChild(div);
                                    break;
                            }
                        };

                        ws.onerror = (err) => {
                            if (err) console.log(err);
                        };

                        // WebSocket closes, so does the game
                        ws.onclose = () => {
                            router.navigate("/");
                            window.location.reload();
                        };
                    } else {
                        document.getElementById("status").innerText = response.data.reason;
                    }
                });
        };
    }
}

/**
 * Verification menu
 */
class Verification extends View {
    didLoad() {
        const { token } = Router.getParameters();

        request.post("/verify", {
            token: token,
        });
    }

    render() {
        const { token } = Router.getParameters();

        return `User ${token} has been verified succesfully!;`;
    }
}

/**
 * Sets the menus
 */
let router = new Router({
    "/": new MainMenu(),
    "/verify/:token": new Verification(),
});

router.listen();

/* Game Itself */

class Game extends Screen {
    constructor() {
        super();
    }

    /**
     * loads assets
     * sets keybinds
     * enables breaking/building
     */
    async create() {
        game.display = new Display(window.innerWidth, window.innerHeight);
        game.display.create();
        game.loader = new Loader();
        game.camera = new Camera(window.innerWidth, window.innerHeight);

        Device.on("resize", () => {
            game.display.resize(window.innerWidth, window.innerHeight);
        });

        game.loader.add("assets/Base_Sprite_Walk.png");
        game.loader.add("assets/cobble.png");

        await game.loader.loadAssets();

        game.assets["base_walk"] = game.loader.get("assets/Base_Sprite_Walk.png");
        game.assets["cobble"] = game.loader.get("assets/cobble.png");

        setAnimations();
        setMaterials();

        send({
            type: "loadWorld",
            world: "start",
        });

        document.getElementById("chatMessage").onkeydown = (e) => {
            switch (e.key) {
                case "Enter":
                    send({
                        type: "chatMessage",
                        message: document.getElementById("chatMessage").value,
                    });

                    document.getElementById("chatMessage").value = "";
                    break;
            }
        };

        window.addEventListener("keydown", (e) => {
            if (document.activeElement == document.getElementById("chatMessage")) {} else {
                switch (e.key) {
                    case "w":
                        up = true;
                        break;

                    case "a":
                        left = true;
                        break;

                    case "s":
                        down = true;
                        break;

                    case "d":
                        right = true;
                        break;

                    case "Escape":
                        console.log("Banana");
                        send({
                            type: "loadSettings",
                        });

                        break;
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            switch (e.key) {
                case "w":
                    up = false;
                    break;

                case "a":
                    left = false;
                    break;

                case "s":
                    down = false;
                    break;

                case "d":
                    right = false;
                    break;
            }
        });

        window.addEventListener("mousedown", (e) => {
            let pos = game.camera.unproject(e.clientX, e.clientY);
            pos.x = Math.floor(pos.x);
            pos.y = Math.floor(pos.y);
            let sector;

            switch (e.button) {
                case 0:
                    sector = findSector(pos.x, pos.y);
                    if (sector != undefined) {
                        for (let i in game.world.map) {
                            let tile = game.world.map[i];
                            tile.rect = new Rectangle(
                                Math.floor(tile.x / 96) * 96,
                                Math.floor(tile.y / 96) * 96,
                                96,
                                96
                            );
                            if (sector.rect.overlaps(tile.rect)) {
                                game.world.map.splice(i, 1);
                            }
                        }
                    }
                    break;

                case 1:
                    break;

                case 2:
                    sector = findSector(pos.x, pos.y);
                    if (sector == (undefined || null)) {
                        game.world.map.push({
                            tile: "cobble",
                            type: "backdrop",
                            x: Math.floor(pos.x / 98) * 98,
                            y: Math.floor(pos.y / 98) * 98,
                        });
                    }
                    break;
            }
        });

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
    }

    /**
     * When we move, tell the server
     */
    update() {
        movement();
        let p = game.players.find((p) => p.id == playerID);
        game.camera.setPosition(p.x, p.y);
        game.camera.update();
    }

    /**
     * Renders map
     * Renders players
     */
    render() {
        game.display.clear();
        if (game.world) {
            for (let i in game.world.map) {
                let tile = game.world.map[i];
                let sector = new Sector(
                    tile.x,
                    tile.y,
                    tile.type,
                    game.materials[tile.tile]
                );
                sector.draw(game.camera);
            }
        }

        for (let i = 0; i < game.players.length; i++) {
            game.players[i].draw(game.camera);
        }
    }
}

/**
 * Sends data to the server
 * @param {Object} data JSON to send
 */
function send(data) {
    ws.send(JSON.stringify(data));
}

/**
 * Sets the animation
 *
 * This is a function for the future movement update
 */
function setAnimations() {
    game.animations["base_idle_right"] = new Animation(game.assets["base_walk"]);
    game.animations["base_idle_right"].setSequence(3 * 48, 0, 48, 48, 1);

    game.animations["base_walk_right"] = new Animation(game.assets["base_walk"]);
    game.animations["base_walk_right"].setSequence(0, 0, 48, 48, 3);
    game.animations["base_walk_right"].setSpeed(10);

    game.animations["base_walk_left"] = new Animation(game.assets["base_walk"]);
    game.animations["base_walk_left"].setSequence(4 * 48, 0, 48, 48, 3);

    send({
        type: "loadPlayers",
    });
}

/**
 * Makes sure we don't collide with walls
 * @param {Player|Object} object Typically a player object, but can be any object
 * @param {Number} x x-pos away from us to check
 * @param {Number} y y-pos away from us to check
 */
function collidesWithObject(object, x, y) {
    if (game.world) {
        object.rect.x += x;
        object.rect.y += y;

        for (let tile of game.world.map) {
            if (tile.type == "wall") {
                if (tile.rect.collides(object.rect)) return true;
            }
        }

        return false;
    }
}

/**
 * Sets our materials
 *
 * WIP for the building blocks update
 */
function setMaterials() {
    game.materials["cobble"] = new Texture(game.assets["cobble"]);
}

/**
 * Gets the tile sector
 * @param {Number} x x-pos
 * @param {Number} y y-pos
 */
function findSector(x, y) {
    for (let tile of game.world.map) {
        let sector = new Sector(
            tile.x,
            tile.y,
            tile.type,
            game.materials[tile.tile]
        );
        if (sector.rect.contains(x, y)) {
            return sector;
        }
    }

    return undefined;
}

/**
 * If the player doesn't collide, if the player is moving, update that position
 */
function movement() {
    let p = game.players.find((p) => p.id == playerID);
    if (up) {
        if (!collidesWithObject(p, 0, 5)) {
            send({
                type: "move",
                pos: {
                    x: p.x,
                    y: p.y + 5,
                },
            });
        }
    }

    if (left) {
        if (!collidesWithObject(p, -5, 0)) {
            send({
                type: "move",
                pos: {
                    x: p.x - 5,
                    y: p.y,
                },
            });
        }
    }

    if (down) {
        if (!collidesWithObject(p, 0, -5)) {
            send({
                type: "move",
                pos: {
                    x: p.x,
                    y: p.y - 5,
                },
            });
        }
    }

    if (right) {
        if (!collidesWithObject(p, 5, 0)) {
            send({
                type: "move",
                pos: {
                    x: p.x + 5,
                    y: p.y,
                },
            });
        }
    }
}

/**
 * Submits the user's usernaem
 */
function submitUsername() {
    send({
        type: "setUser",
        user: document.getElementById("username").value,
    });
    document.getElementById("app").removeChild(document.getElementById("chat"));
}