export class Blueprint {
    constructor(name) {
        this.name = name;
        this.tiles = [];
        this.ids = {};
    }

    setTiles(tiles) {
        this.tiles = tiles;
    }

    setNameById(id, name) {
        this.ids[id] = name;
    }

    getNameById(id) {
        return this.ids[id];
    }

    convert(tiles) {
        let newTiles = [];

        for (let i = 0; i < this.tiles.length; i++) {
            let tileRow = this.tiles[i];
            for (let j = 0; j < tileRow.length; j++) {
                let tile = tileRow[j];
                if (tile != 0) {
                    newTiles.push({ name: this.getNameById(tile), x: j * 96, y: i * 96 });
                }
            }
        }

        return newTiles;
    }

    compile() {
        return this.convert(this._tiles)
    }
}