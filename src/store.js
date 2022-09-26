import { reactive } from "vue";
import { useToast } from "vue-toastification";
import { logEvent } from "firebase/analytics";
import { GoogleAuthProvider, signInWithRedirect, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

import { analytics, auth, db } from "./firebase";
import router from "./router";

const toast = useToast();
const roles = ["student", "instructor", "director"];

const state = reactive({
  auth: {
    loading: true,
    user: undefined,
  },
});

const mutations = {
  // Authentication
  setAuthLoading: v => state.auth.loading = v,
  setAuthUser: v => state.auth.user = v,
};

const actions = {
  // Toasts
  errorToast: msg => toast.error(msg),
  infoToast: msg => toast.info(msg),
  successToast: msg => toast.success(msg),
  // Authentication
  login: async () => {
    try {
      mutations.setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(`[ERROR] login function - ${error.message}`);
      actions.errorToast("Error logging you in. Please try again shortly.");
    }
  },
  logout: async () => {
    try {
      mutations.setAuthLoading(true);

      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error(`[ERROR] logout function - ${error.message}`);
      actions.errorToast("Error logging you out. Please try again shortly.");
    } finally {
      mutations.setAuthLoading(false);
    }
  },
  authStateChanged: async user => {
    // Firebase user is not authenticated
    if (!user) {
      if (state.auth.user) { // user is authenticated (so we have their name)
        actions.successToast(`Goodbye, ${state.auth.user.name}!`);
      }

      mutations.setAuthUser(null);
      mutations.setAuthLoading(false);
      return;
    }

    // Check if the user is using their Miami email address
    if (!user.email.includes("@miamioh.edu")) {
      logEvent(analytics, 'non_miami_email', {
        email: user.email,
      });
      actions.errorToast("Please use your Miami University email account.");
      await actions.logout();
      return;
    }

    // Check if the user is authorized to use the application
    const q = query(
      collection(db, "users"),
      where("email", "==", user.email)
    );
    const qsnap = await getDocs(q);
    if (qsnap.empty) {
      logEvent(analytics, 'unauthorized_user', {
        email: user.email,
      });
      actions.errorToast("You are not authorized. Contact Professor Ferris if you think this is an error.");
      await actions.logout();
      return;
    }

    // Save the user to state
    const usrInfo = qsnap.docs[0].data();
    let usr = {
      name: usrInfo.name,
      email: usrInfo.email,
      highestRole: 0,
      sections: [],
    };
    qsnap.forEach(doc => {
      const data = doc.data();

      if (data.role > usr.highestRole) usr.highestRole = data.role;

      if (data.role == 0 && data.enrolled) {
        usr.sections.push({
          id: doc.id,
          role: data.role,
          section: data.section,
          present: data.present,
          excused: data.excused,
          dishonest: data.dishonest,
          lastAttended: data.lastAttended ? data.lastAttended.toDate() : null,
        });
      } else if (data.role >= 1) {
        usr.sections.push({
          id: doc.id,
          role: data.role,
          section: data.section,
        });
      }
    });
    logEvent(analytics, `${roles[usr.highestRole]}_login`, {
      email: usr.email,
    });
    mutations.setAuthUser(usr);
    actions.successToast(`Welcome back, ${state.auth.user.name}`);
    await router.push(`/${roles[usr.highestRole]}`);
    mutations.setAuthLoading(false);
  },
};

export default { roles, state, mutations, actions };
