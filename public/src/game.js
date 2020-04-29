import { Screen, Renderable } from "@outwalk/skylark";
import { Socket } from "./Socket";
import { GameManager } from "./GameManager";
import { Keybinds } from "./Keybinds";
import { Mapper } from "./Mapper";
import { Sector } from "./Sector";
import { TileSet } from "./TileSet";

export class Game extends Screen {
    constructor(url, email, password) {
        super();

        window.game = {
            animations: {},
            assets: {},
            id: 1,
            materials: {},
            players: [],
            textureRegion: {}
        };

        window.ws = new Socket(url, email, password)
        ws.trackOpen();
        ws.trackMessage();
        ws.trackError();
        ws.trackClose();
    }

    create() {
        GameManager.setup();
        GameManager.loadAssets();

        Keybinds.windowKeys();
        Keybinds.windowClick();
    }

    update() {
        try {
            Mapper.movement(ws);
            let p = game.players.find((p) => p.id == game.playerID);
            game.camera.setPosition(p.x, p.y);
            game.camera.update();
        } catch (err) {

        }
    }

    render() {
        game.display.clear();
        if (game.world) {
            for (let i in game.world.map) {
                let tile = game.world.map[i];
                let area = Mapper.getSurrounding(tile.x, tile.y, 96, 96);
                let { x, y } = TileSet.getTile("dirt", area);
                game.train.setRegion(x, y);

                let sector = new Sector(
                    tile.x,
                    tile.y,
                    96, 96,
                    tile.type,
                    game.train
                );
                sector.draw(game.camera);
            }
        }

        for (let i = 0; i < game.players.length; i++) {
            game.players[i].draw(game.camera);
        }
    }
}