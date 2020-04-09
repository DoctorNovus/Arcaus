import {
    Router,
    View,
    http
} from "jolt";

import {
    Screen,
    Display,
    Device,
    Loader,
    Animation,
    Camera
} from "@outwalk/skylark";

import { Player } from "./player";

let ws;
let email;

window.game = {
    animations: {},
    assets: {},
    players: []
};

let playerID;

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
        `);
    }

    render() {
        return `
            <img src="assets/logo.png" id="background">
            <form id="login">
                <input id="email" placeholder="Email" />
                <input id="password" type="password" placeholder="Password" />
                <button type="submit">Connect</button>
                <h2 id="status"></h2>
            </form>
        `;
    }

    didLoad() {
        document.getElementById("login").onsubmit = (e) => {
            e.preventDefault();

            http.post("/login", {
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            }).then((response) => {
                if (response.statusCode == 201) {
                    ws = new WebSocket(response.data.socket);

                    ws.onopen = () => {
                        send({
                            type: "connect",
                            email: document.getElementById("email").value,
                            password: document.getElementById("password").value
                        });

                        email = document.getElementById("email").value;
                    };

                    ws.onmessage = (data) => {
                        data = JSON.parse(data.data);

                        switch (data.type) {
                            case "status":
                                document.getElementById("status").innerText = data.message;

                                if (data.login) {
                                    setTimeout(() => {
                                        document.getElementById("app").innerHTML = "";
                                        Screen.setScreen(new Game());

                                    });
                                };

                                break;

                            case "setPlayers":
                                game.players = [];
                                for (let i in data.players) {
                                    let p = data.players[i];
                                    let player = new Player(p.x, p.y, 32, 32, game.animations["base_idle_right"]);
                                    player.id = p.id;
                                    game.players.push(player);
                                }
                                break;

                            case "updatePlayer":
                                let player = game.players.find(p => p.id == data.player.id);
                                player.move(data.player.x, data.player.y);
                                break;

                            case "setID":
                                playerID = data.id;
                                break;
                        }
                    }

                    ws.onerror = (err) => {
                        if (err) console.log(err);
                    }

                    ws.onclose = () => {
                        router.navigate("/");
                        window.location.reload();
                    }
                } else {
                    document.getElementById("status").innerText = response.data.reason;
                }
            })
        }
    }
};

let router = new Router({
    "/": new MainMenu()
});

router.listen();

/* Game Itself */

class Game extends Screen {

    constructor() {
        super();
    }

    async create() {
        game.display = new Display(window.innerWidth, window.innerHeight);
        game.display.create();
        game.loader = new Loader();
        game.camera = new Camera(window.innerWidth, window.innerHeight);


        Device.on("resize", () => {
            game.display.resize(window.innerWidth, window.innerHeight);
        });

        game.loader.add("assets/Base_Sprite_Walk.png");

        await game.loader.loadAssets();

        game.assets["base_walk"] = game.loader.get("assets/Base_Sprite_Walk.png");

        setAnimations();
    }

    update() {
        // console.log(game.players);
    }

    render() {
        game.display.clear();
        for (let i = 0; i < game.players.length; i++) {
            game.players[i].draw(game.camera);
        }
    }

    dispose() {

    }
}

function send(data) {
    ws.send(JSON.stringify(data));
}

function setAnimations() {

    game.animations["base_idle_right"] = new Animation(game.assets["base_walk"]);
    game.animations["base_idle_right"].setSequence(3 * 48, 0, 48, 48, 1);

    game.animations["base_walk_right"] = new Animation(game.assets["base_walk"])
    game.animations["base_walk_right"].setSequence(0, 0, 48, 48, 3);
    game.animations["base_walk_right"].setSpeed(10);

    game.animations["base_walk_left"] = new Animation(game.assets["base_walk"])
    game.animations["base_walk_left"].setSequence(4 * 48, 0, 48, 48, 3);

    send({
        type: "loadPlayers"
    });
}

window.onkeydown = (e) => {
    let p = game.players.find(p => p.id == playerID);
    switch (e.key) {
        case "w":
            break;

        case "a":
            send({
                type: "move",
                pos: {
                    x: p.x - 5,
                    y: p.y
                }
            })

            break;

        case "s":
            break;

        case "d":
            send({
                type: "move",
                pos: {
                    x: p.x + 5,
                    y: p.y
                }
            });
            break;
    }
}