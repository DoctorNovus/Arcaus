import { Component, Router, request } from "jolt";

export class InputVerification extends Component {
    constructor() {
        super();
        this.state.response = "";
    }

    render() {
        return `
            <form @submit="sendUsername">
                <input placeholder="Input username here" />
            </form>

            <span style="color: white;">${this.state.response}</span>
        `;
    }

    async sendUsername(e) {
        e.preventDefault();
        const { token } = Router.getParameters();
        let twine = await request.post("/verify", { token: token, username: e.path[0][0].value });
        twine.data.then(logic => {
            this.state.response = logic.status;
        })
    }
}