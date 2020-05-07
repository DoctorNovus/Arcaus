import { Component } from "jolt";

export class World extends Component {
    constructor() {
        super();
    }

    render() {
        return `
        <style>
        :host {
            display: flex;
            flex-direction: column;
            color: black;
        }
        </style>

        <img @click="joinWorld" src="/assets/portal.png" width="75px" height="75px">
        <span @click="joinWorld"><slot></slot></span>
        `;
    }

    joinWorld(e) {
        window.joinGameWorld = this.innerText.split(":")[0];
    }
}