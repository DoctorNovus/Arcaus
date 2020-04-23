import { View, Component } from "jolt";
import { LoginScreen } from "./LoginScreen";
import { ChatWindow } from "./ChatWindow";

Component.register("login-screen", LoginScreen);
Component.register("chat-window", ChatWindow);

export class App extends View {

    render() {
        return `
            <login-screen id="loginScreen"></login-screen>
            <chat-window id="chatBox"></chat-window>
        `;
    }

    didLoad() {
        document.getElementById("chatBox").style.display = "none";
    }
}