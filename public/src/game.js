import { Screen, Renderable, Keyboard, Mouse } from "@outwalk/skylark";
import { Socket } from "./Socket";
import { GameManager } from "./GameManager";
import { Keybinds } from "./Keybinds";
import { Mapper } from "./Mapper";
import { Sector } from "./Sector";
import { TileSet } from "./TileSet";

export class Game extends Screen {
    constructor(url, email, password) {
        super();

        this.game = {
            animations: {},
            assets: {},
            id: 1,
            materials: {},
            players: [],
            textureRegion: {}
        };

        this.ws = new Socket(url, email, password)
        this.ws.trackOpen();
        this.ws.trackMessage(this.game);
        this.ws.trackError();
        this.ws.trackClose();
    }

    create() {
        GameManager.setup(this.game)
        GameManager.loadAssets(this.game);
        Keyboard.use();
        Mouse.use();
    }

    update() {
        Keyboard.update();
        Mouse.update();
        Keybinds.windowKeys(this.game, this.ws);
        Keybinds.windowClick(this.game, this.ws);
        let p = this.game.players.find((p) => p.id == this.game.playerID);
        if (p) {
            this.game.camera.setPosition(p.x, p.y);
            this.game.camera.update();
        }
    }

    render() {
        this.game.display.clear();
        if (this.game.world) {
            for (let i in this.game.world.map) {
                let tile = this.game.world.map[i];
                let area = Mapper.getSurrounding(this.game, tile.x, tile.y, 96, 96);
                let { x, y } = TileSet.getTile(tile.tile, area);
                this.game.train.setRegion(x, y);

                let sector = new Sector(
                    tile.x,
                    tile.y,
                    96, 96,
                    tile.type,
                    this.game.train
                );
                sector.draw(this.game.camera);
            }
        }

        for (let i = 0; i < this.game.players.length; i++) {
            this.game.players[i].draw(this.game.camera);
        }
    }
}