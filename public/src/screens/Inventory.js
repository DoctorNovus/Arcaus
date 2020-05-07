import { Component } from "jolt";

export class Inventory extends Component {
    constructor() {
        super();
        this.state.items = ["dirt", "cobble", "rock"];
    }

    render() {
        const items = this._retItems(this.state.items);
        return `
        <style>
        :host {
            width: 100%;
            height: 100%;
            background-color: black;
        }

        :host div {

        }
        </style>

        <div>
        ${items}
        </div>
        `;
    }

    _retItems(items) {
        let text = ``;
        for (let i = 0; i < items.length; i++) {
            text += `<game-item item="${items[i]}"></game-item>`;
        }
        return text;
    }
}