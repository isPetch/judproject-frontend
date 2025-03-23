<script setup>
import { ref, onMounted, computed } from 'vue';
import { getUserById } from "../composable/getJudProjects";
import { useRouter } from 'vue-router';
const tabs = [
  { name: "Dashboard", link: "/" },
  { name: "Projects", link: "/projects" },
];

const router = useRouter(); 
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
     if (userData.pictureName) {
      profileImage.value = await import.meta.env.VITE_ROOT_API + `/api/profile/picture/${userData.pictureName}`;
    } else {
      profileImage.value = null; 
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
});

const profileImage = ref(null); // รูปโปรไฟล์ที่เลือก
const image = ref(null);

// ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // สร้าง URL ของไฟล์ที่เลือก
    image.value = file;
    const fileURL = URL.createObjectURL(file);
    profileImage.value = fileURL; // ตั้งค่ารูปโปรไฟล์ใหม่
  }
};
// สร้างตัวย่อของชื่อจากตัวอักษรแรก + ตัวอักษรสุดท้าย
const userInitials = computed(() => {
  if (!username.value) return "";
  const trimmedName = username.value.trim();
  return trimmedName.length > 1 
    ? trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(trimmedName.length - 1).toUpperCase()
    : trimmedName.charAt(0).toUpperCase();
});
const isMenuOpen = ref(false);

const handleLogout = () => {
  
  localStorage.removeItem('token'); // ลบ Token
  localStorage.removeItem('userId'); // ลบ userId
  
  router.push('/login');
};

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
    <div class="dropdown dropdown-end">
      <button @click="isMenuOpen = !isMenuOpen">
        <div class="flex items-center space-x-2">
          <!-- Check if profileImage exists. If not, show initials -->
          <div class="avatar avatar-placeholder">
            <div class="bg-white text-neutral-content w-8 h-8 rounded-full">
              <!-- If no profile image, show initials -->
              <span v-if="!profileImage" class="text-xs font-bold text-black">{{ userInitials }}</span>
              <!-- If profile image exists, show image -->
              <img v-if="profileImage" :src="profileImage" class="w-8 h-8 object-cover rounded-full" />
            </div>
          </div>
          <div class="font-semibold">{{ username }}</div> <!-- Show the username next to the avatar -->
        </div>
      </button>

      <!-- Dropdown Menu -->
      <ul v-show="isMenuOpen" class="menu menu-sm dropdown-content bg-gray-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
        <li>
          <router-link to="/profile" class="justify-between font-bold text-lg text-black">
            Profile Settings
            <img src="../components/icon/profile-user.png" class="h-5 w-5" />
          </router-link>
        </li>
        <li>
          <a class="text-red-500 font-bold text-lg justify-between" @click="handleLogout">
            Logout
            <img src="../components/icon/logoutt.png" class="h-5 w-5" />
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

