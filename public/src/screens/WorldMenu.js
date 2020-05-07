import { Component } from "jolt";

export class WorldMenu extends Component {
    constructor() {
        super();
        this.state.worlds = "";
    }

    render() {
        const worlds = this._renderWorlds(this.state.worlds);
        return `
        <style>
            :host {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                position: absolute;
                top: 0px;
                left: 0px;
                background-image: url("/assets/galaxy.png");
                background-size: cover;
                background-repeat: no-repeat;
                text-align: center;
            }

            :host form {
                width: 100%;
                height: 5%;
                top: 0%;
                left: 0%;
            }

            :host img {
                position: absolute;
                top: 0%;
                left: 0%;
            }

            :host div{
                position: absolute;
                top: 5%;
                left: 0%;
                width: 100%;
                height: auto;
                overflow-x: hidden;
                overflow-y: scroll;
            }

            ul {
                display: flex;
                flex-direction: row;
                list-style-type: none;
                flex-wrap: wrap;
                justify-content: space-around;
                text-align: left;
            }

            li {
                flex: 1 0 11%
            }
        </style>
        <form @change="listWorlds" @submit="joinWorld">
            <input placeholder="Enter World Name" style="z-index: 99999"> 
        </form>
        <div>
        ${worlds}
        </div>
        `;
    }

    _renderWorlds(worlds) {
        return worlds;
    }

    listWorlds() {

    }

    joinWorld(e) {
        e.preventDefault();
        joinGameWorld = e.path[0][0].value;
    }
}