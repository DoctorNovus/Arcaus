import { Component } from "jolt";

export class ChatWindow extends Component {
    constructor() {
        super();

        this.state.messages = "";
        this.state.value = "";
    }

    render() {
        const messages = this._updateMessages(this.state.messages);
        const value = this._updateValue(this.state.value);
        return `
        <style>
            :host {
                background-color: rgba(255, 255, 255, 0.5);
                width: 25%;
                height: 30%;
                position: absolute;
                bottom: 0%;
                left: 0%;
            }

            #messages{
                position: absolute;
                bottom: 10%;
                left: 0%;
                width: 99.5%;
                height: 90%;
            }

            #chatInput{
                position: absolute;
                bottom: 0%;
                left: 0%;
                height: 10%;
                width: 99.5%;
                background-color: transparent;
                border: 1px solid black;
            }
        </style>

        <form @submit="sendMessage">
            <div id="messages" class="chatBoxElement">
            ${messages}
            </div>
            <input id="chatInput" value="${value}" class="chatBoxElement" placeholder="Send Message"/>
        </form>
        `;
    }

    sendMessage(e) {
        e.preventDefault();

        let input = e.path[0][0];

        ws.send({
            type: "chatMessage",
            message: input.value
        });

        input.value = "";
    }

    _updateMessages(text) {
        let toDisplay = "";
        const messages = text.split(/;/g);
        for (let message of messages) {
            toDisplay += `<span>${message}</span><br>`;
        }

        return toDisplay;
    }

    _updateValue(text) {
        return text;
    }
}