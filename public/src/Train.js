import { Texture, TextureRegion } from "@outwalk/skylark";

export class Train extends TextureRegion {
    constructor(image) {
        super(image);
    }

    setRegion(x, y) {
        super.setRegion(x, y, 32, 32);
    }
}