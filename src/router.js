import { createRouter, createWebHistory } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import { logEvent } from "firebase/analytics";

import store from "./store";
import { analytics, auth } from "./firebase";

const getCurrentUser = () => new Promise((resolve, reject) => {
  const unsubscribe = onAuthStateChanged(auth, _ => {
    unsubscribe();
    resolve();
  }, reject);
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/student",
      component: () => import("./views/Student.vue"),
      meta: { requiresAuth: true, requiredRole: 0 },
    },
    {
      path: "/instructor",
      component: () => import("./views/Instructor.vue"),
      meta: { requiresAuth: true, requiredRole: 1 },
    },
    {
      path: "/director",
      component: () => import("./views/Director.vue"),
      meta: { requiresAuth: true, requiredRole: 2 },
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("./views/NotFound.vue"),
    },
  ],
});

router.beforeEach(async (to, _) => {
  if ((typeof store.state.auth.user) == undefined) {
    await getCurrentUser();
  }

  if (to.meta.requiresAuth && !store.state.auth.user) {
    return "/";
  } else if (to.path == "/" && store.state.auth.user) {
    return `/${store.roles[store.state.auth.user.highestRole]}`;
  } else if (to.meta.requiresAuth && store.state.auth.user) {
    const userRole = store.state.auth.user.highestRole;
    if (to.meta.requiredRole > userRole) {
      store.actions.errorToast("You are not authorized to access that page!");
      logEvent(analytics, 'attempted_access', {
        to_route: to.fullPath,
        email: store.state.auth.user.email,
        role: store.state.auth.user.highestRole,
      });
      return `/${store.roles[userRole]}`;
    }
  }
});

router.afterEach((to, from) => {
  logEvent(analytics, 'route_change', {
    to_route: to.fullPath,
    from_route: from.fullPath,
  });
});

export default router;
