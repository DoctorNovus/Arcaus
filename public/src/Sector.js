import { Renderable, Rectangle } from "@outwalk/skylark";

export class Sector extends Renderable {
    constructor(x, y, width, height, type, material) {
        super(material);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        super.setPosition(this.x, this.y);
        super.setSize(this.width, this.height);
        this.rect = new Rectangle(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        this.type = type;
    }
}