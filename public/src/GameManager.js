import { Device, Display, Loader, Camera, Animation, Texture, EventBus } from "@outwalk/skylark";
import { Train } from "./Train";
import { Keybinds } from "./Keybinds";

export class GameManager {

    static setup(game) {
        game.display = new Display(window.innerWidth, window.innerHeight);
        game.display.create();
        game.loader = new Loader();
        game.width = 1280;
        game.height = 720;
        game.camera = new Camera(game.width, game.height);
        Device.on("resize", () => {
            game.display.resize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener("contextmenu", e => {
            e.preventDefault();
        })

        document.getElementById("chatBox").style.display = "block";
    }

    static async loadAssets(game) {
        game.loader.add("assets/Base_Sprite_Walk.png");
        game.loader.add("assets/tileset.png");
        game.loader.add("assets/background.png");

        await game.loader.loadAssets();

        game.assets["base_walk"] = game.loader.get("assets/Base_Sprite_Walk.png");
        game.assets["tileset"] = game.loader.get("assets/tileset.png");
        game.assets["background"] = game.loader.get("assets/background.png");

        GameManager.setAnimations(game);
        GameManager.setMaterials(game);
    }

    static setAnimations(game) {
        game.animations["base_idle_right"] = new Animation(game.assets["base_walk"]);
        game.animations["base_idle_right"].setSequence(3 * 48, 0, 48, 48, 1);

        game.animations["base_walk_right"] = new Animation(game.assets["base_walk"]);
        game.animations["base_walk_right"].setSequence(0, 0, 48, 48, 3);
        game.animations["base_walk_right"].setSpeed(10);

        game.animations["base_walk_left"] = new Animation(game.assets["base_walk"]);
        game.animations["base_walk_left"].setSequence(4 * 48, 0, 48, 48, 3);
    }

    static setMaterials(game) {
        game.train = new Train(game.assets["tileset"]);
        game.materials["tileset"] = new Texture(game.assets["tileset"]);
        game.materials["background"] = new Texture(game.assets["background"]);
    }

}