import { Player } from "./Player";

export class Socket extends WebSocket {
    constructor(url, email, password) {
        super(url);
        this.email = email;
        this.password = password;

        this.setProps();
    }

    setProps() {
        document.getElementById("settingsMenu").ws = this;
        document.getElementById("worldMenu").ws = this;
    }

    trackOpen(game) {
        super.onopen = () => {
            this.send({
                type: "connect",
                email: this.email,
                password: this.password
            });
        }
    }

    trackMessage(game) {
        super.onmessage = (data) => {
            data = JSON.parse(data.data);
            switch (data.type) {
                case "status":
                    if (data.login) {
                        this.send({
                            type: "loadPlayers"
                        });

                        game.connected = true;
                    };
                    break;

                case "setWorld":
                    game.world = data.world;
                    document.getElementById("chatBox").style.display = "block";
                    break;

                case "setPlayers":
                    game.players = [];
                    for (let i in data.players) {
                        let p = data.players[i];
                        let player = new Player(
                            p.x,
                            p.y,
                            96,
                            96,
                            game.animations["base_idle_right"]
                        );
                        player.id = p.id;
                        player.world = p.world;
                        game.players.push(player);
                    }
                    break

                case "updatePlayer":
                    let player = game.players.find(p => p.id == data.player.id);
                    if (data.player.x || data.player.y) {
                        player.move(data.player.x, data.player.y);
                    }

                    if (data.player.world) {
                        player.world = data.player.world;
                        document.querySelector("world-menu").style.display = "none";
                    };

                    break;

                case "setID":
                    game.playerID = data.id;
                    break;

                case "chatMessage":
                    let chat = document.getElementById("chatBox");
                    chat.state.messages += `${data.message};`;
                    break;

                case "setWorlds":
                    game.worlds = data.worlds;
                    let worlds = Object.values(data.worlds);
                    worlds.sort((a, b) => (a.count > b.count) ? -1 : 1);
                    let text = "<ul>";
                    for (let i = 0; i < worlds.length; i++) {
                        let world = worlds[i];
                        text += `<li><game-world>${world.name}: ${world.count}</game-world></li>`
                    }
                    text += "</ul>"

                    document.getElementById("worldMenu").state.worlds = `${text}`;
                    break;
            }
        }
    }

    trackError() {
        super.onerror = (err) => {
            if (err) throw err;
        }
    }

    trackClose() {
        super.onclose = () => {
            window.location = "/";
        }
    }

    send(data) {
        data = JSON.stringify(data);
        super.send(data);
    }
}