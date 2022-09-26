import { createApp } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import Toast from "vue-toastification";

import { auth } from "./firebase";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "./style.css";
import "vue-toastification/dist/index.css";

createApp(App).use(Toast, {}).use(router).mount("#app");

onAuthStateChanged(auth, store.actions.authStateChanged);
