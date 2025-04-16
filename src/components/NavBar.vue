<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getUserById } from "../composable/getJudProjects";
import { useRouter } from 'vue-router';

const tabs = [
  { name: "Dashboard", link: "/dashboard", icon: "📊" },
  { name: "Projects", link: "/projects", icon: "📁" },
];

const router = useRouter();
const username = ref('');
const email = ref('');
const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);
const profileImage = ref(null);
const image = ref(null);
const isMenuOpen = ref(false);

// ตรวจสอบการ scroll
onMounted(() => {
  fetchUserData();
  window.addEventListener('scroll', handleScroll);
});

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(token);
    username.value = userData.username;
    email.value = userData.email;

    if (userData.pictureName) {
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/profile/picture`, {
        method: 'GET',
        headers: { 
          'Authorization': token
        }
      });

      if (response.ok) {
        const imageBlob = await response.blob();
        profileImage.value = URL.createObjectURL(imageBlob); 
      } else {
        console.error("Failed to fetch profile image:", response.status);
      }
    } else {
      profileImage.value = null;
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
};


const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    image.value = file;
    const fileURL = URL.createObjectURL(file);
    profileImage.value = fileURL;
  }
};

const userInitials = computed(() => {
  if (!username.value) return "";
  const trimmedName = username.value.trim();
  return trimmedName.length > 1 
    ? trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(trimmedName.length - 1).toUpperCase()
    : trimmedName.charAt(0).toUpperCase();
});

const activeRoute = computed(() => {
  return router.currentRoute.value.path;
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  router.push('/login');
};

// ปิด dropdown เมื่อคลิกที่อื่น
const closeMenuOnOutsideClick = (event) => {
  if (isMenuOpen.value && !event.target.closest('.user-menu')) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeMenuOnOutsideClick);
});
</script>

<template>
  <nav :class="['fixed top-0 left-0 w-full z-50 transition-all duration-300', 
    isScrolled ? 'py-2 shadow-lg bg-opacity-95' : 'py-4', 'bg-[#316394]']">
    <div class="w-full px-4 md:px-6 lg:px-8">
      <div class="flex justify-between items-center">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-2">
          <div class="relative group bg-white p-1 rounded-lg">
            <img src="../components/image/jubprojectLogo.png" alt="JudProject Logo" 
                class="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
            <div class="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
          <span class="text-lg font-bold text-white hidden md:block">JudProject</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <div class="flex space-x-2">
            <router-link
              v-for="tab in tabs"
              :key="tab.name"
              :to="tab.link"
              :class="['px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 font-medium',
                activeRoute === tab.link 
                  ? 'bg-white text-blue-800' 
                  : 'text-white hover:bg-white hover:bg-opacity-20']"
            >
              <span>{{ tab.icon }}</span>
              <span>{{ tab.name }}</span>
            </router-link>
          </div>

          <!-- User Profile (Desktop) -->
          <div class="user-menu relative">
            <button @click="isMenuOpen = !isMenuOpen" 
                    class="flex items-center space-x-2 py-2 px-3 rounded-full transition-all duration-300 hover:bg-white hover:bg-opacity-20">
              <div class="avatar">
                <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white ring-2 ring-white">
                  <span v-if="!profileImage" class="text-xs font-bold text-blue-800">{{ userInitials }}</span>
                  <img v-else :src="profileImage" class="w-full h-full object-cover" />
                </div>
              </div>
              <div class="text-sm font-medium text-white">{{ username }}</div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" :class="{ 'rotate-180': isMenuOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- User Dropdown -->
            <div v-show="isMenuOpen" 
                 class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 origin-top-right">
              <!-- User Info Section -->
              <div class="p-4 bg-blue-100">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-blue-500">
                    <span v-if="!profileImage" class="text-lg font-bold text-blue-800">{{ userInitials }}</span>
                    <img v-else :src="profileImage" class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p class="font-semibold text-blue-800">{{ username }}</p>
                    <p class="text-xs text-gray-600">{{ email }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Menu Items -->
              <div class="py-2">
                <router-link to="/profile" class="flex items-center px-4 py-3 text-gray-800 hover:bg-blue-50 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile Settings</span>
                </router-link>
                
                <a @click="handleLogout" class="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden">
          <button @click="isMenuOpen = !isMenuOpen" class="mr-4 text-white">
            <div class="avatar">
              <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white ring-2 ring-white">
                <span v-if="!profileImage" class="text-xs font-bold text-blue-800">{{ userInitials }}</span>
                <img v-else :src="profileImage" class="w-full h-full object-cover" />
              </div>
            </div>
          </button>
          
          <button @click="toggleMobileMenu" class="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-show="isMobileMenuOpen" class="md:hidden bg-blue-700 mt-2 rounded-b-lg overflow-hidden transition-all duration-300">
      <div class="w-full px-4 py-2">
        <div class="flex flex-col space-y-2">
          <router-link
            v-for="tab in tabs"
            :key="tab.name"
            :to="tab.link"
            :class="['px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200',
              activeRoute === tab.link 
                ? 'bg-white text-blue-800' 
                : 'text-white hover:bg-white hover:bg-opacity-20']"
            @click="isMobileMenuOpen = false"
          >
            <span>{{ tab.icon }}</span>
            <span>{{ tab.name }}</span>
          </router-link>
        </div>
        
        <div class="mt-4 pt-3 border-t border-blue-600">
          <router-link to="/profile" class="flex items-center px-4 py-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Settings</span>
          </router-link>
          
          <a @click="handleLogout" class="flex items-center px-4 py-3 text-white hover:bg-red-500 rounded-lg transition-colors duration-200 mt-2 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-enter-active {
  animation: fadeIn 0.2s ease-out;
}
</style>