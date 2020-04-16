import { Renderable, Rectangle } from "@outwalk/skylark";

export class Sector extends Renderable {
    constructor(x, y, type, material) {
        super(material);
        this.x = x;
        this.y = y;
        this.rect = new Rectangle(x, y, 96, 96);
        super.setPosition(x, y);
        this.type = type;
    }
}