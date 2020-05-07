import { Mouse, Buttons, Keyboard, Keys } from "@outwalk/skylark";

export class Keybinds {
    static windowKeys(game, ws) {
        let player = game.players.find(p => p.id == game.playerID);
        player = game.players.find(p => p.id == game.playerID);
        if (document.activeElement != document.getElementById("chatBox")) {
            if (Keyboard.isKeyDown(Keys.W)) {
                ws.send({
                    type: "move",
                    direction: "up"
                });
            }

            if (Keyboard.isKeyDown(Keys.S)) {
                ws.send({
                    type: "move",
                    direction: "down"
                });
            }

            if (Keyboard.isKeyDown(Keys.A)) {
                ws.send({
                    type: "move",
                    direction: "left"
                });
            }

            if (Keyboard.isKeyDown(Keys.D)) {
                ws.send({
                    type: "move",
                    direction: "right"
                });
            }

            if (Keyboard.isKeyDown(Keys.ESCAPE)) {
                document.getElementById("settingsMenu").style.display = "flex";
            }
        } else {}
    };

    static windowClick(game, socket) {
        let pos = game.camera.unproject(Mouse.x, Mouse.y);
        if (Mouse.isButtonDown(Buttons.LEFT)) {
            socket.send({
                type: "click",
                button: "left",
                pos: {
                    x: pos.x,
                    y: pos.y
                },
                item: ItemInHand
            })
        }

        if (Mouse.isButtonDown(Buttons.RIGHT)) {
            socket.send({
                type: "click",
                button: "right",
                pos: {
                    x: pos.x,
                    y: pos.y
                },
                item: ItemInHand
            })
        }
    }
}