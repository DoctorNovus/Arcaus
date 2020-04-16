import { View } from "jolt";

export class App extends View {

    constructor(container) {
        super(container);

        this.state.set({
            screen: `<login-screen state=${this.state}></login-screen>`
        });
    }

    render() {
        return `${this.state.screen}`;
    }
}