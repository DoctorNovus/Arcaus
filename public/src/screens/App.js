import { View, Component } from "jolt";
import { LoginScreen } from "./LoginScreen";
import { ChatWindow } from "./ChatWindow";
import { SettingsMenu } from "./SettingsMenu";

Component.register("login-screen", LoginScreen);
Component.register("chat-window", ChatWindow);
Component.register("settings-menu", SettingsMenu);

export class App extends View {

    render() {
        return `
            <login-screen id="loginScreen"></login-screen>
            <chat-window id="chatBox"></chat-window>
            <settings-menu id="settingsMenu"></settings-menu>
        `;
    }

    didLoad() {
        document.getElementById("chatBox").style.display = "none";
        document.getElementById("settingsMenu").style.display = "none";
    }
}