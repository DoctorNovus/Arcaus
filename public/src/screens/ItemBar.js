import { Component } from "jolt";

export class ItemBar extends Component {
    constructor() {
        super();
        this.state.items = {
            0: "cobble",
            1: "dirt",
            2: "dirt",
            3: "dirt",
            4: "dirt",
            5: "dirt",
            6: "dirt",
            7: "dirt",
            8: "dirt"
        };
    }

    render() {
        const itemsHTML = this._retItems(this.state.items);
        return itemsHTML;
    }

    _retItems(items) {
        let itemsHTML = `<div>`;
        let its = Object.values(items);
        for (let i = 0; i < its.length; i++) {
            itemsHTML += `<game-item item="${this.state.items[i]}"></game-item>`;
        }
        itemsHTML += "</div>";

        return `
        <style>
            :host div {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 10%;
                justify-content: space-around;
            }
        </style>

        ${itemsHTML}
        `;
    }
}