export class TileSet {
    static getTile(tile, pos) {
        let data;

        switch (tile) {
            case "dirt":
                data = TileSet.getDirt(pos);
                break;

            case "cobble":
                data = TileSet.getCobble(pos);
                break;
        }

        return data;
    }

    static getDirt(pos) {
        switch (pos) {
            case "top":
                return {
                    x: 0,
                    y: 0
                }
                break;

            case "core":
                return {
                    x: 0,
                    y: 32
                }
                break;
        }
    }

    static getCobble(pos) {
        switch (pos) {
            case "top":
                return {
                    x: 32,
                    y: 0
                }
                break;

            case "core":
                return {
                    x: 32,
                    y: 32
                }
                break;
        }
    }
}