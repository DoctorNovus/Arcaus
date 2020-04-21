import { Component } from "jolt";

export class ChatWindow extends Component {
    constructor() {
        super();

        this.state.messages = [];
    }

    render() {
        const messages = this._updateMessages(this.state.messages);
        return `
        <style>
            chat-window{
                display: hidden;
            }

            #messages{
                position: absolute;
                bottom: 10%;
                left: 0%;
            }

            #chatInput{
                position: absolute;
                bottom: 0%;
                left: 0%;
            }

        </style>

        <div id="messages">
        ${messages}
        </div>
        <input id="chatInput" placeholder="Send Message" @submit="sendMessage" />
        `;
    }

    sendMessage() {
        let input = event.path[0][0];
        Socket.send({
            type: "chatMessage",
            message: input.value
        });

        input.value = "";
    }

    _updateMessages(messages) {
        const toDisplay = [];
        for (let message of messages) {
            toDisplay.push(`<span>${message}</span>`);
        }

        return toDisplay;
    }
}