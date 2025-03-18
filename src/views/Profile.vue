<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserById } from "../composable/getJudProjects";

const router = useRouter();
const tabs = [
  { name: "Dashboard", link: "/" },
  { name: "Projects", link: "/projects" },
];

const username = ref('');
const email = ref('');

const isEditingUsername = ref(false);
const isEditingEmail = ref(false);
const successMessage = ref(''); // Reactive variable to hold the success message
const loading = ref(true); // Add loading status to wait until data is fetched

onMounted(async () => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(userId);
    console.log('User Data:', userData); // Check the data we are receiving from the API
    username.value = userData.username;
    email.value = userData.email;
    loading.value = false; // Set loading to false when data is fetched
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    loading.value = false; // Set loading to false even if the data fetch fails
  }
});

const toggleEdit = (field) => {
  if (field === 'username') {
    isEditingUsername.value = !isEditingUsername.value;
  } else if (field === 'email') {
    isEditingEmail.value = !isEditingEmail.value;
  }
};

const updateUserField = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    
    formData.append('username', username.value);
    formData.append('email', email.value);
   if(image.value)
   {
    formData.append('picture', image.value, image.value.name)
   }
    
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/profile/update", {
      method: 'PUT',
      headers: { 
        'Authorization': userId
      },
      body: formData,
    });
    
    const result = await response.json();
    if (result && result.status === 'Success') {
      successMessage.value = "Profile updated successfully!";
      setTimeout(() => successMessage.value = '', 1000);
    } else {
      console.error("Error updating profile:", result.message);
    }
  } catch (error) {
    console.error("Error updating profile:", error.message);
  }
};


const saveChanges = (field) => {
  const value = field === 'username' ? username.value : email.value;

  // Check that the value is not empty
  if (!value.trim()) {
    alert(`${field} cannot be empty!`);
    return; // Stop if value is empty
  }

  console.log(`${field} value:`, value); // Debugging to ensure the correct value is sent

  updateUserField(field, value).then(() => {
    toggleEdit(field); // Close the editing mode after saving
  });
};

const deleteAccount = async () => {
  try {
    const userId = localStorage.getItem('userId');
    console.log(userId)
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/account/delete", {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('userId')
      },
    });

    const result = await response.json();
    if (response.ok) {
      console.log("Account deleted successfully.");
      alert("Your account has been deleted.");
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('lastLogin');
      router.push({ name: 'Login'})
    } else {
      console.error("Error deleting account:", result.message);
    }
  } catch (error) {
    console.error("Error deleting account:", error.message);
  }
};

const userInitials = computed(() => {
  if (!username.value) return "";
  const trimmedName = username.value.trim();
  return trimmedName.length > 1 
    ? trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(trimmedName.length - 1).toUpperCase()
    : trimmedName.charAt(0).toUpperCase();
});

const profileImage = ref(null); // รูปโปรไฟล์ที่เลือก
const image = ref(null);
// ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // สร้าง URL ของไฟล์ที่เลือก
    image.value = file
    const fileURL = URL.createObjectURL(file);
    profileImage.value = fileURL; // ตั้งค่ารูปโปรไฟล์ใหม่
  }
};

</script>

<template>
  <div class="w-screen h-screen bg-white flex flex-col">
    <nav class="fixed top-0 left-0 w-full z-50 text-white p-4 flex justify-between items-center" style="background-color: #316394;">
      <div class="flex flex-row items-center space-x-6">
        <div class="flex items-center space-x-2">
          <img src="../components/image/jubproject.png" alt="JudProject Logo" class="h-6 w-6" />
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
    </nav>

    <div class="max-w-7xl mx-auto mt-36 bg-gray-100 p-20 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-4">Profile</h2>
     <div class="flex flex-col items-center mb-4">
  <div class="avatar avatar-placeholder">
    <div class="bg-white text-neutral-content w-24 h-24 rounded-full flex items-center justify-center">
      <!-- ใช้ <img> แสดงรูปโปรไฟล์ถ้ามี -->
      <img   v-if="profileImage" :src="profileImage" alt="Profile Image" class="w-full h-full object-cover rounded-full" />
      <!-- ถ้าไม่มีรูปโปรไฟล์จะแสดงตัวอักษรย่อ -->
      <span v-else class="text-xs font-bold text-black">{{ userInitials }}</span>
    </div>
  </div>
  
  <div class="mt-4 flex space-x-2">
    <label for="file-upload" class="bg-blue-600 text-white px-6 py-3 rounded cursor-pointer">Upload New</label>
    <input type="file" id="file-upload" class="hidden" @change="handleFileUpload" accept="image/*" />
    <button class="bg-gray-400 text-white px-6 py-3 rounded">Delete</button>
  </div>
</div>


      <!-- Success Message -->
      <div v-if="successMessage" class="bg-green-400 text-white text-center p-3 rounded-lg mb-4">
        {{ successMessage }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">Loading...</div>

      <div v-else class="space-y-4">
        <!-- Username and Email (Flex) -->
        <div class="flex space-x-4">
          <!-- Username -->
          <div class="flex-1">
            <label class="block text-gray-700 font-medium mb-1">Username</label>
            <div class="relative flex items-center">
              <input
                type="text"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="!isEditingUsername"
                v-model="username"
              />
              <button v-if="!isEditingUsername" class="absolute right-2 top-2 text-gray-500 hover:text-gray-700" @click="toggleEdit('username')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                </svg>
              </button>
              <button v-if="isEditingUsername" class="ml-2 px-4 py-2 rounded-lg text-white" 
                      :class="{
                        'bg-green-500': username.trim(),
                        'bg-gray-400 cursor-not-allowed': !username.trim()
                      }"
                      @click="saveChanges('username')" :disabled="!username.trim()">
                Save
              </button>
            </div>
          </div>

          <!-- Email -->
          <div class="flex-1">
            <label class="block text-gray-700 font-medium mb-1">Email</label>
            <div class="relative flex items-center">
              <input
                type="email"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="!isEditingEmail"
                v-model="email"
              />
              <button v-if="!isEditingEmail" class="absolute right-2 top-2 text-gray-500 hover:text-gray-700" @click="toggleEdit('email')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                </svg>
              </button>
              <button v-if="isEditingEmail" class="ml-2 px-4 py-2 rounded-lg text-white" 
                      :class="{
                        'bg-green-500': email.trim(),
                        'bg-gray-400 cursor-not-allowed': !email.trim()
                      }"
                      @click="saveChanges('email')" :disabled="!email.trim()">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <router-link to="/password" class="text-red-600 hover:underline">Change Password</router-link>
      </div>

      <div class="flex mt-6 justify-center">
        <button class="bg-red-500 text-white px-6 py-3 rounded" @click="deleteAccount">Delete Account</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
