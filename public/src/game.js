import { Screen } from "@outwalk/skylark";
import { Socket } from "./Socket";
import { GameManager } from "./GameManager";
import { Keybinds } from "./Keybinds";
import { Mapper } from "./Mapper";
import { Sector } from "./Sector";

export class Game extends Screen {
    constructor(url, email, password) {
        super();

        window.game = {
            animations: {},
            assets: {},
            id: 1,
            materials: {},
            players: [],
        };

        this.ws = new Socket(url, email, password)
        this.ws.trackOpen();
        this.ws.trackMessage();
        this.ws.trackError();
        this.ws.trackClose();
    }

    create() {
        GameManager.setup();
        GameManager.loadAssets();

        Keybinds.windowKeys();
        Keybinds.windowClick();
    }

    update() {
        Mapper.movement(this.ws);
        let p = game.players.find((p) => p.id == game.playerID);
        game.camera.setPosition(p.x, p.y);
        game.camera.update();
    }

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