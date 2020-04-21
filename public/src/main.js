import { App } from "./screens/App";
import { Verification } from "./screens/Verification";

import { Router } from "jolt";

const router = new Router({
    "/": new App(document.getElementById("app")),
    "/verify/:token": new Verification(document.getElementById("app"))
})

router.listen();