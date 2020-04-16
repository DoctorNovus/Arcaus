import { Component, request } from "jolt";

class LoginScreen extends Component {

    constructor() {
        super();

        this.state.status = "";
    }
    render() {
        return `
            <img src="assets/logo.png" id="background" />
            <form @submit="validateAccount">
                <input id="email" type="email" placeholder="Email" />
                <input id="password" type="password" placeholder="Password" />
                <button type="submit">Connect</button>
                <span>${this.state.status}</span>
        `;
    }

    async validateAccount(event) {
        event.preventDefault();

        const response = await request.post("/login", {
            email: document.querySelector("#email").value.toLowerCase(),
            password: document.querySelector("#password").value,
        });

        if (response.status != 201) {
            this.state.status = response.data.reason;
            return;
        }

        /* create websocket connection and change screen */
    }
}

Component.register("login-screen", LoginScreen);