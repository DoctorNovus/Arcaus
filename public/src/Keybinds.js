import { Mapper } from "./Mapper";
import { Rectangle } from "@outwalk/skylark";

export class Keybinds {
    static windowKeys() {
        console.log(game.playerID);
        console.log(game.players);
        let player = game.players.find(p => p.id == game.playerID);
        window.addEventListener("keydown", (e) => {
            player = game.players.find(p => p.id == game.playerID);
            if (document.activeElement == document.getElementById("chatBox")) {} else {
                switch (e.key) {
                    case "w":
                        player.direction.up = true;
                        break;

                    case "a":
                        player.direction.left = true;
                        break;

                    case "s":
                        player.direction.down = true;
                        break;

                    case "d":
                        player.direction.right = true;
                        break;
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            player = game.players.find(p => p.id == game.playerID);
            switch (e.key) {
                case "w":
                    player.direction.up = false;
                    break;

                case "a":
                    player.direction.left = false;
                    break;

                case "s":
                    player.direction.down = false;
                    break;

                case "d":
                    player.direction.right = false;
                    break;
            }
        });
    }

    static windowClick() {
        window.addEventListener("mousedown", (e) => {
            let pos = game.camera.unproject(e.clientX, e.clientY);
            pos.x = Math.floor(pos.x);
            pos.y = Math.floor(pos.y);
            let sector;

            switch (e.button) {
                case 0:
                    sector = Mapper.findSector(pos.x, pos.y);
                    if (sector != undefined) {
                        for (let i in game.world.map) {
                            let tile = game.world.map[i];
                            tile.rect = new Rectangle(
                                ((Math.floor(tile.x) / 96) * 96) - 96 / 2,
                                ((Math.floor(tile.y) / 96) * 96) - 96 / 2,
                                96,
                                96
                            );

                            if (sector.rect.contains(tile.x, tile.y)) {
                                game.world.map.splice(i, 1);
                            }
                        }
                    }
                    break;

                case 1:
                    break;

                case 2:
                    sector = Mapper.findSector(pos.x, pos.y);
                    if (sector == (undefined || null)) {
                        game.world.map.push({
                            tile: "cobble",
                            type: "backdrop",
                            x: (Math.floor(pos.x / 96) * 96),
                            y: (Math.floor(pos.y / 96) * 96),
                        });
                    }
                    break;
            }
        });

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
    }
}