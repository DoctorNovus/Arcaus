import { Component } from "jolt";

export class SettingsMenu extends Component {
    constructor() {
        super();
    }

    render() {
        return `
        <style>
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                position: absolute;
                text-align: center;
                top: 50%;
                left: 50%;
            }

            :host * {
                width: 100%;
                height: 2em;
            }

        </style>

        <button @click="exitWorld">Exit World</button>
        <button @click="closeMenu">Close</button>
        `;
    }

    exitWorld() {
        if (this.ws) {
            this.style.display = "none";
            this.ws.send({
                type: "getWorlds"
            });

            document.getElementById("worldMenu").style.display = "flex";
            document.getElementById("chatBox").style.display = "none";
        }
    }

    closeMenu() {
        this.style.display = "none";
    }
}