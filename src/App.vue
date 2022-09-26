<script setup>
  import store from "./store";

  import AppBar from "./components/AppBar.vue";
  import AppFooter from "./components/AppFooter.vue";
</script>

<template>
  <div class="min-h-screen w-screen px-4 flex flex-col">
    <app-bar />
    <div v-if="!store.state.auth.loading" class="flex-1 flex">
      <router-view />
    </div>
    <div v-else class="flex-1 flex justify-center items-center">
      <div class="flex items-center gap-4 text-gray-500 text-xl">
        <span class="h-12 w-12 block rounded-full border-4 border-t-blue-400 animate-spin"></span>
        loading...
      </div>
    </div>
    <app-footer />
  </div>
</template>
