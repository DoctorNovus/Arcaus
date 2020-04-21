import { Component, request } from "jolt";
import { Screen } from "@outwalk/skylark";
import { Game } from "../game";

export class LoginScreen extends Component {

    constructor() {
        super();

        this.state.status = "";
    }

    render() {
        return `
        <style>
            form {
                display: flex;
                flex-direction: column;
                width: 50%;
                margin: auto;
                height: 50%;
                position: absolute;
                top: 45%;
                left: 25%;
                color: white;
            }
            
            .menu {
                display: flex;
                flex-direction: column;
                width: 50%;
                margin: auto;
                height: 50%;
                position: absolute;
                top: 45%;
                left: 25%;
                color: white;
            }
            
            form * {
                background-color: transparent;
                height: 10%;
                color: white;
            }
            
            #status {
                width: 100%;
                height: auto;
            }
            
            #background {
                width: 100%;
                height: 10%;
                margin: auto;
            }
            
            #chat {
                color: white;
                position: absolute;
                bottom: 2.5%;
                left: 5%;
                height: 30%;
                width: 35%;
                background-color: rgba(240, 248, 255, 0.05);
                overflow-x: none;
                overflow-y: scroll;
            }
            
            #chatMessage {
                height: 2.5%;
                position: absolute;
                left: 5%;
                bottom: 0%;
                width: 35%;
                background-color: rgba(240, 248, 255, 0.05);
                overflow-x: scroll;
                overflow-y: none;
                color: white;
            }
            </style>

            <img src="assets/logo.png" id="background" />
            <form @submit="validateAccount">
                <input id="email" type="email" placeholder="Email" autocomplete="on" />
                <input id="password" type="password" placeholder="Password" autocomplete="on" />
                <button type="submit">Connect</button>
                <span>${this.state.status}</span>
            </form>
        `;
    }

    async validateAccount(event) {
        event.preventDefault();

        let email = event.path[0][0].value.toLowerCase();
        let password = event.path[0][1].value;

        const response = await request.post("/login", {
            email: email,
            password: password
        });

        if (response.status != 201) {
            this.state.status = response.data.reason;
            return;
        } else {
            response.data.then((data) => {
                this.style.display = "none";
                Screen.setScreen(new Game(data.socket, email, password));
            });
        }

        /* create websocket connection and change screen */
    }
}