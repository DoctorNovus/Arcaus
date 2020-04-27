import { Player } from "./Player";
import { Mapper } from "./Mapper";

export class Socket extends WebSocket {
    constructor(url, email, password) {
        super(url);
        this.email = email;
        this.password = password;
    }

    trackOpen() {
        super.onopen = () => {
            this.send({
                type: "connect",
                email: this.email,
                password: this.password
            });
        }
    }

    trackMessage() {
        super.onmessage = (data) => {
            data = JSON.parse(data.data);
            switch (data.type) {
                case "status":
                    console.log(data);
                    if (data.login) {
                        this.send({
                            type: "loadPlayers"
                        });
                    };
                    break;

                case "setWorld":
                    game.world = data.world;
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
                        game.players.push(player);
                    }
                    break

                case "updatePlayer":
                    let player = game.players.find(p => p.id == data.player.id);
                    player.move(data.player.x, data.player.y);
                    break;

                case "setID":
                    game.playerID = data.id;
                    break;

                case "chatMessage":
                    let chat = document.getElementById("chatBox");
                    chat.state.messages += `${data.message};`;
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