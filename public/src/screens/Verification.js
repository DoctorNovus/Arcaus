import { View, Component } from "jolt";
import { InputVerification } from "./InputVerification";

Component.register("input-verification", InputVerification);

export class Verification extends View {
    render() {
        return `
            <input-verification></input-verification>
        `;
    }
}