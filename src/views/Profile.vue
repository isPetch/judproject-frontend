<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getUserById } from "../composable/getJudProjects";
import NavBar from '../components/NavBar.vue';

const router = useRouter();

const username = ref('');
const email = ref('');
const isEditingUsername = ref(false);
const isEditingEmail = ref(false);
const successMessage = ref('');
const loading = ref(true);
const profileImage = ref(null);
const image = ref(null);
const pictureName = ref(null);
const showConfirmDelete = ref(false);

// Toast notification system
const toast = ref({
  show: false,
  message: '',
  type: 'success' // 'success', 'error', 'warning'
});

// Show toast notification
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  };
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

// Close toast
const closeToast = () => {
  toast.value.show = false;
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(token);
    username.value = userData.username;
    email.value = userData.email;
    pictureName.value = userData.pictureName;

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
    
    loading.value = false; 
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    loading.value = false; 
    showToast("Failed to load user profile. Please try again later.", "error");
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
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('username', username.value);
    formData.append('email', email.value);
    if (image.value) {
      formData.append('picture', image.value, image.value.name);
    }
    
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/profile/update", {
      method: 'PUT',
      headers: { 
        'Authorization': token
      },
      body: formData,
    });
    
    const result = await response.json();
    if (result && result.status === 'Success') {
      showToast("Profile updated successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      if (result.message && result.message.includes("Duplicate entry") && result.message.includes("username")) {
        showToast("Username already taken. Please choose another.", "error");
      } else if (result.message && result.message.includes("Duplicate entry") && result.message.includes("email")) {
        showToast("Email already in use. Please use another.", "error");
      } else {
        showToast("Error updating profile: " + (result.message || "Please try again"), "error");
      }
    }
  } catch (error) {
    showToast("Error updating profile: " + error.message, "error");
  }
};

const saveChanges = (field) => {
  const value = field === 'username' ? username.value : email.value;

  // Check that the value is not empty
  if (!value.trim()) {
    showToast(`${field} cannot be empty!`, "error");
    return;
  }

  // Email validation
  if (field === 'email') {
    const emailRegex = /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/;
    if (!emailRegex.test(value)) {
      showToast("Please enter a valid email address", "error");
      return;
    }
  }

  // Username validation - at least 5 characters
  if (field === 'username' && value.trim().length < 5) {
    showToast("Username must be at least 5 characters long", "error");
    return;
  }

  updateUserField().then(() => {
    toggleEdit(field);
  });
};

const confirmDeleteAccount = () => {
  showConfirmDelete.value = true;
};

const cancelDeleteAccount = () => {
  showConfirmDelete.value = false;
};

const deleteAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/account/delete", {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
    });

    const result = await response.json();
    if (response.ok) {
      showToast("Your account has been deleted successfully.");
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('lastLogin');
      setTimeout(() => {
        router.push({ name: 'Login'});
      }, 1500);
    } else {
      showToast("Error deleting account: " + (result.message || "Please try again"), "error");
    }
  } catch (error) {
    showToast("Error deleting account: " + error.message, "error");
  } finally {
    showConfirmDelete.value = false;
  }
};

const userInitials = computed(() => {
  if (!username.value) return "";
  const trimmedName = username.value.trim();
  return trimmedName.length > 1 
    ? trimmedName.charAt(0).toUpperCase() + trimmedName.charAt(trimmedName.length - 1).toUpperCase()
    : trimmedName.charAt(0).toUpperCase();
});

// Handle file upload for profile picture
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit", "error");
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      showToast("Please select an image file", "error");
      return;
    }
    
    image.value = file;
    const fileURL = URL.createObjectURL(file);
    profileImage.value = fileURL;
    
    // Auto-save the image when selected
    updateUserField();
  }
};

const deleteProfileImage = async () => {
  try {
    if (!pictureName.value) {
      showToast("No profile image to delete.", "warning");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(`${import.meta.env.VITE_ROOT_API}/api/profile/picture/${pictureName.value}`, {
      method: "DELETE",
      headers: {
        "Authorization": token,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      showToast("Profile picture deleted successfully.");
      profileImage.value = null;
      image.value = null;
      pictureName.value = null;
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast("Error deleting profile picture: " + (result.message || "Please try again"), "error");
    }
  } catch (error) {
    showToast("Error deleting profile picture: " + error.message, "error");
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
    <NavBar />

    <!-- Loading Spinner -->
    <div v-if="loading" class="flex-grow flex items-center justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 border-opacity-75"></div>
    </div>

    <div v-else class="container mx-auto px-4 py-8 max-w-4xl pt-24">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">Profile Settings</h2>
        <p class="mt-2 text-gray-600">Update your personal information and account preferences</p>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- Profile Picture Section -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 flex flex-col items-center">
          <div class="relative group mb-6">
            <div class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
              <img 
                v-if="profileImage" 
                :src="profileImage" 
                alt="Profile" 
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-600">
                {{ userInitials }}
              </div>
            </div>

            <div class="absolute bottom-0 right-0 flex space-x-2">
              <input 
                type="file" 
                id="profilePicture" 
                class="hidden" 
                @change="handleFileUpload" 
                accept="image/*"
              />
              <label 
                for="profilePicture" 
                class="cursor-pointer bg-white text-indigo-600 p-2 rounded-full shadow-lg hover:bg-indigo-50 transition-all duration-200 inline-flex items-center justify-center w-10 h-10"
                title="Upload new picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              
              <button
                v-if="profileImage"
                @click="deleteProfileImage"
                class="bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-all duration-200 inline-flex items-center justify-center w-10 h-10"
                title="Delete picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <h3 class="text-white text-xl font-semibold">{{ username }}</h3>
          <p class="text-indigo-100">{{ email }}</p>
        </div>

        <!-- Profile Details -->
        <div class="p-6 md:p-8">
          <div class="grid gap-6 max-w-xl mx-auto">
            <!-- Username Field -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div class="flex items-center">
                <div class="relative flex-grow">
                  <input
                    type="text"
                    class="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    :class="{'bg-white': isEditingUsername}"
                    :disabled="!isEditingUsername"
                    v-model="username"
                  />
                  <div v-if="isEditingUsername" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    Min. 5 characters
                  </div>
                </div>
                <button 
                  v-if="!isEditingUsername" 
                  @click="toggleEdit('username')"
                  class="ml-3 text-indigo-600 hover:text-indigo-800 transition-colors p-2 rounded-full hover:bg-indigo-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <div v-if="isEditingUsername" class="ml-3 flex space-x-2">
                  <button 
                    @click="saveChanges('username')"
                    class="px-4 py-2 rounded-lg text-white transition-colors bg-indigo-600 hover:bg-indigo-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                  <button
                    @click="toggleEdit('username')"
                    class="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Email Field -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div class="flex items-center">
                <div class="relative flex-grow">
                  <input
                    type="email"
                    class="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    :class="{'bg-white': isEditingEmail}"
                    :disabled="!isEditingEmail"
                    v-model="email"
                  />
                </div>
                <button 
                  v-if="!isEditingEmail" 
                  @click="toggleEdit('email')"
                  class="ml-3 text-indigo-600 hover:text-indigo-800 transition-colors p-2 rounded-full hover:bg-indigo-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <div v-if="isEditingEmail" class="ml-3 flex space-x-2">
                  <button 
                    @click="saveChanges('email')"
                    class="px-4 py-2 rounded-lg text-white transition-colors bg-indigo-600 hover:bg-indigo-700 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                  <button
                    @click="toggleEdit('email')"
                    class="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Account Actions -->
            <div class="pt-4 mt-2 border-t border-gray-200">
              <div class="flex flex-col sm:flex-row justify-between gap-4">
                <router-link 
                  to="/password" 
                  class="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                  Change Password
                </router-link>
                
                <button 
                  @click="confirmDeleteAccount"
                  class="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="toast.show" 
        class="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-lg flex items-center z-50 max-w-md w-full"
        :class="{
          'bg-green-50 text-green-800 border-l-4 border-green-500': toast.type === 'success',
          'bg-red-50 text-red-800 border-l-4 border-red-500': toast.type === 'error',
          'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500': toast.type === 'warning'
        }"
      >
        <div class="mr-3 flex-shrink-0">
          <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-grow">{{ toast.message }}</div>
        <button @click="closeToast" class="ml-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </transition>
    
    <!-- Delete Account Confirmation Modal -->
    <transition name="modal">
      <div v-if="showConfirmDelete" class="fixed inset-0 flex items-center justify-center z-50">
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="cancelDeleteAccount"></div>
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 relative z-10">
          <div class="flex items-center justify-center mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-center mb-2">Delete Account</h3>
          <p class="text-gray-600 mb-6 text-center">
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              @click="cancelDeleteAccount"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              @click="deleteAccount"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Yes, Delete My Account
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.toast-enter-active, 
.toast-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}

.toast-enter-from, 
.toast-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>