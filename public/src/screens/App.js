import { View, Component } from "jolt";
import { LoginScreen } from "./LoginScreen";
import { ChatWindow } from "./ChatWindow";
import { SettingsMenu } from "./SettingsMenu";
import { WorldMenu } from "./WorldMenu";
import { World } from "./World";

Component.register("login-screen", LoginScreen);
Component.register("chat-window", ChatWindow);
Component.register("settings-menu", SettingsMenu);
Component.register("world-menu", WorldMenu);
Component.register("game-world", World);

export class App extends View {

    render() {
        return `
            <world-menu id="worldMenu"></world-menu>
            <login-screen id="loginScreen"></login-screen>
            <chat-window id="chatBox"></chat-window>
            <settings-menu id="settingsMenu"></settings-menu>
        `;
    }

    didLoad() {
        document.getElementById("chatBox").style.display = "none";
        document.getElementById("settingsMenu").style.display = "none";
        document.getElementById("worldMenu").style.display = "none";
    }
}