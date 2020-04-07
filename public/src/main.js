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
} from "@outwalk/skylark";

const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {

};

ws.onmessage = (data) => {
    data = JSON.parse(data.data);

    switch (data.type) {
        case "status":
            document.getElementById("status").innerText = data.message;

            if (data.login) {
                setTimeout(() => {
                    router.navigate("/game");
                }, 2500);
            };

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

            send({
                "type": "connect",
                "email": document.getElementById("email").value,
                "password": document.getElementById("password").value
            });
        }
    }
};

class GameDisplay extends View {

    load() {
        super.addStyle(`
            html,
            body{
                overflow: hidden;
                margin: 0px;
                padding: 0px;
            }
        `);
    }

    render() {
        return ``;
    }

    didLoad() {
        Screen.setScreen(new Game());
    }
};

let router = new Router({
    "/": new MainMenu(),
    "/game": new GameDisplay()
});

router.listen();

/* Game Itself */

class Game extends Screen {

    constructor() {
        super();
    }

    async create() {
        this.display = new Display(window.innerWidth, window.innerHeight);
        this.display.create();
        this.loader = new Loader();

        Device.on("resize", () => {
            this.display.resize(window.innerWidth, window.innerHeight);
        })

        await this.loader.loadAssets();
    }

    update() {

    }

    render() {
        this.display.clear();
    }

    dispose() {

    }
}

function send(data) {
    ws.send(JSON.stringify(data))
}