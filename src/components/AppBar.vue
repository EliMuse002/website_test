<script setup>
  import store from "../store";
</script>

<template>
  <div class="w-full py-4 mb-2 flex items-center justify-between gap-4">
    <router-link
      :to="store.state.auth.user ? store.roles[store.state.auth.user.highestRole] : '/'"
      class="font-semibold text-3xl tracking-tight text-blue-400 select-none"
    >
      QR <span class="text-purple-400">@</span>
    </router-link>
    <div v-if="store.state.auth.user" class="flex gap-6 items-center text-slate-700">
      <router-link v-if="store.state.auth.user.highestRole >= 1" to="/instructor" class="hidden sm:block hover:text-purple-700 font-semibold">Instructor</router-link>
      <router-link v-if="store.state.auth.user.highestRole == 2" to="/director" class="hidden sm:block hover:text-purple-700 font-semibold">Director</router-link>
      <button @click="store.actions.logout" :disabled="store.state.auth.loading" class="rounded-full text-sm font-semibold px-4 py-2 border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-red-100 duration-200 select-none">
        Log out
      </button>
    </div>
  </div>
</template>