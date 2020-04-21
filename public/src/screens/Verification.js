import { View, Router, request } from "jolt";

export class Verification extends View {


    render() {
        return `<h1>Account has been verified successfully</h1>`;
    }

    async didLoad() {
        const { token } = Router.getParameters();
        await request.post("/verify", { token: token });
    }
}