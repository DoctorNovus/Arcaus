import { Device, Display, Loader, Camera, Animation, Texture, TextureRegion } from "@outwalk/skylark";
import { Train } from "./Train";

export class GameManager {

    static setup() {
        game.display = new Display(window.innerWidth, window.innerHeight);
        game.display.create();
        game.loader = new Loader();
        game.camera = new Camera(window.innerWidth, window.innerHeight);
        Device.on("resize", () => {
            game.display.resize(window.innerWidth, window.innerHeight);
        });

        document.getElementById("chatBox").style.display = "block";
    }

    static async loadAssets() {
        game.loader.add("assets/Base_Sprite_Walk.png");
        game.loader.add("assets/tileset.png");

        await game.loader.loadAssets();

        game.assets["base_walk"] = game.loader.get("assets/Base_Sprite_Walk.png");
        game.assets["tileset"] = game.loader.get("assets/tileset.png");

        GameManager.setAnimations();
        GameManager.setMaterials();
    }

    static setAnimations() {
        game.animations["base_idle_right"] = new Animation(game.assets["base_walk"]);
        game.animations["base_idle_right"].setSequence(3 * 48, 0, 48, 48, 1);

        game.animations["base_walk_right"] = new Animation(game.assets["base_walk"]);
        game.animations["base_walk_right"].setSequence(0, 0, 48, 48, 3);
        game.animations["base_walk_right"].setSpeed(10);

        game.animations["base_walk_left"] = new Animation(game.assets["base_walk"]);
        game.animations["base_walk_left"].setSequence(4 * 48, 0, 48, 48, 3);
    }

    static setMaterials() {
        game.train = new Train(game.assets["tileset"]);
        game.materials["tileset"] = new Texture(game.assets["tileset"]);
    }
}