import { Renderable, Rectangle } from "@outwalk/skylark";

export class Player extends Renderable {
    constructor(x, y, width, height, material) {
        super(material);

        this.x = x;
        this.y = y;
        super.setPosition(x, y);
        this.rect = new Rectangle(x, y, width, height);

        this.width = width;
        this.height = height;
    }

    setAnimation(animation) {
        super.setMaterial(animation);
    }

    move(x, y) {
        this.x = x;
        this.y = y;
        super.setPosition(x, y);
    }
}