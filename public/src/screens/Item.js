import { Component } from "jolt";
import { Mouse, Buttons } from "@outwalk/skylark";

export class Item extends Component {
    constructor() {
        super();
    }

    render() {
        const item = this.retItem(this.state.text, this.getAttribute("item"));
        return `
        <style>
            :host {
                width: 7.5vmin;
                height: 7.5vmin;
                border-radius: 5px;
                border: 1px solid teal;
            }

            :host img {
                width: 7.5vmin;
                height: 7.5vmin;
            }
            
        </style>

        <img src="/assets/items/${item}.png" alt="" @click="click" />
        `;
    }

    retItem(src, id) {
        if (!src) {
            if (!id) {
                return "dirt";
            } else {
                return id;
            }
        } else {
            return src;
        }
    }

    click() {
        if (this.state.text) {
            ItemInHand = this.state.text;
        } else if (this.getAttribute("item")) {
            ItemInHand = this.getAttribute("item");
        } else {
            ItemInHand = "dirt";
        }
        document.getElementById("inventory").style.display = "none";
    }
}