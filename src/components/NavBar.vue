<script setup>
import { ref, onMounted, computed } from 'vue';
import { getUserById } from "../composable/getJudProjects";

const tabs = [
  { name: "Dashboard", link: "/" },
  { name: "Projects", link: "/projects" },
];

const username = ref('');
const email = ref('');

onMounted(async () => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(userId);
    username.value = userData.username;
    email.value = userData.email;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
});

// สร้างตัวย่อของชื่อจากตัวอักษรแรก + ตัวอักษรสุดท้าย
const userInitials = computed(() => {
  if (!username.value) return "";
  const trimmedName = username.value.trim();
  return trimmedName.length > 1 
    ? trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(trimmedName.length - 1).toUpperCase()
    : trimmedName.charAt(0).toUpperCase();
});
</script>

<template>
  <nav class="fixed top-0 left-0 w-full z-50 text-white p-4 flex justify-between items-center" style="background-color: #316394;">
    <div class="flex flex-row space-x-6 items-center">
      <div class="flex items-center space-x-2">
        <img src="../components/image/jubproject.png" alt="JudProject Logo" class="h-10 w-10" />
        <span class="text-lg font-bold">JudProject</span>
      </div>

      <div class="text-sm flex space-x-6">
        <router-link
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.link"
          class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300"
        >
          {{ tab.name }}
        </router-link>
      </div>
    </div>

    <!-- User Name -->
    <div class="flex items-center space-x-2">
      <div class="avatar avatar-placeholder">
        <div class=" bg-white text-neutral-content w-8 rounded-full">
          <span class="text-xs font-bold text-black">{{ userInitials }}</span>
        </div>
      </div>
      <div class="font-semibold">{{ username }}</div>
    </div>
  </nav>
</template>
