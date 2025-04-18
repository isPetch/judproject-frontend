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

// Add popup state and message refs
const popupMessage = ref('');
const showPopup = ref(false);

// Function to show error popup
const showPopupError = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

// Function to close popup
const closePopup = () => {
  showPopup.value = false;
  popupMessage.value = '';
};

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(token);
    console.log('User Data:', userData); 
    username.value = userData.username;
    email.value = userData.email;
    pictureName.value = userData.pictureName;

    if (userData.pictureName) {
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/profile/picture`, {
        method: 'GET',
        headers: { 
          'Authorization': token,
          
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
    showPopupError("Failed to load user profile. Please try again later.");
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
      successMessage.value = "Profile updated successfully!";
      setTimeout(() => successMessage.value = '', 1000);
      window.location.reload();
    } else {
      console.error("Error updating profile:", result.message);

      if (result.message && result.message.includes("Duplicate entry") && result.message.includes("username")) {
        showPopupError("Duplicate Username, Please Rename.");
      } else if (result.message && result.message.includes("Duplicate entry") && result.message.includes("email")) {
        showPopupError("Duplicate Email, Please Use Another.");
      } else {
        showPopupError("Error updating profile: " + (result.message || "Please try again"));
      }
    }
  } catch (error) {
    console.error("Error updating profile:", error.message);
    showPopupError("Error updating profile: " + error.message);
  }
};


const saveChanges = (field) => {
  const value = field === 'username' ? username.value : email.value;

  // Check that the value is not empty for username or email
  if (!value.trim() && (field === 'username' || field === 'email')) {
    showPopupError(`${field} cannot be empty!`);
    return; // Stop if value is empty
  }

  // Email validation
  if (field === 'email') {
    const emailRegex = /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/;
    if (!emailRegex.test(value)) {
      showPopupError("Please enter a valid email address");
      return;
    }
  }

  // Username validation - at least 5 characters
  if (field === 'username' && value.trim().length < 5) {
    showPopupError("Username must be at least 5 characters long");
    return;
  }

  const formData = new FormData();
  if (field === 'username' || field === 'email') {
    formData.append(field, value); 
  }
  if (image.value) {
    formData.append('picture', image.value, image.value.name); 
  }

  console.log(`${field} value:`, value);
  if (image.value) {
    console.log("Updated image:", image.value.name);
  }

  // Update the user field after validation
  updateUserField(formData).then(() => {
    toggleEdit(field); 
  });
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
      console.log("Account deleted successfully.");
      alert("Your account has been deleted.");
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('lastLogin');
      router.push({ name: 'Login'} )
    } else {
      console.error("Error deleting account:", result.message);
      showPopupError("Error deleting account: " + (result.message || "Please try again"));
    }
  } catch (error) {
    console.error("Error deleting account:", error.message);
    showPopupError("Error deleting account: " + error.message);
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
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showPopupError("File size exceeds 5MB limit");
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      showPopupError("Please select an image file");
      return;
    }
    
    // สร้าง URL ของไฟล์ที่เลือก
    image.value = file;
    const fileURL = URL.createObjectURL(file);
    profileImage.value = fileURL; // ตั้งค่ารูปโปรไฟล์ใหม่
  }
};

const pictureName = ref(null);

const deleteProfileImage = async () => {
  try {
    if (!pictureName.value) {
      showPopupError("No profile image to delete.");
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
      alert("Profile picture deleted successfully.");
      profileImage.value = null;
      image.value = null;
      pictureName.value = null;
      window.location.reload();
    } else {
      console.error("Error deleting profile picture:", result.message);
      showPopupError("Error deleting profile picture: " + (result.message || "Please try again"));
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error.message);
    showPopupError("Error deleting profile picture: " + error.message);
  }
};

</script>
<template>
  <div class="min-h-screen from-indigo-100 bg-gray-50 flex flex-col">
    <NavBar />

    <div class="px-4 py-20">
      
        <!-- Header -->
        <div class="mt-4 p-6 text-center">
          <h2 class="text-4xl font-extrabold text-black tracking-tight">Profile Settings</h2>
        </div>
         <hr>
        <!-- Profile Picture Section -->
        <div class="p-8 bg-gray-50">
          <div class="flex flex-col items-center mb-8">
            <div class="relative group w-56 h-56">
              <div class="w-full h-full rounded-full border-4 border-indigo-200 shadow-lg overflow-hidden">
                <img 
                  v-if="profileImage" 
                  :src="profileImage" 
                  alt="Profile" 
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div v-else class="w-full h-full bg-indigo-100 flex items-center justify-center text-5xl font-bold text-indigo-600">
                  {{ userInitials }}
                </div>
              </div>

              <div class="absolute bottom-0 right-0">
                <input 
                  type="file" 
                  id="profilePicture" 
                  class="hidden" 
                  @change="handleFileUpload" 
                  accept="image/*"
                />
                <label 
                  for="profilePicture" 
                  class="cursor-pointer bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300 transform hover:scale-110 inline-block"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
            </div>

            <div class="mt-6 flex space-x-4">
              <button
                @click="saveChanges"
                class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Upload New</span>
              </button>
              <button
                @click="deleteProfileImage"
                class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>

          <!-- Profile Details -->
          <div class="flex justify-center">
          <div class="space-y-6 w-3/4 md:w-1/2 lg:w-1/3">
            <!-- Profile Fields with Modern Input Styling -->
            <div class="grid grid-cols-1 gap-6">
              <!-- Username Field -->
              <div class="bg-white rounded-lg shadow-md p-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="text"
                    class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    :disabled="!isEditingUsername"
                    v-model="username"
                  />
                  <button 
                    v-if="!isEditingUsername" 
                    @click="toggleEdit('username')"
                    class="text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    v-if="isEditingUsername" 
                    @click="saveChanges('username')"
                    class="px-4 py-2 rounded-md text-white transition-colors"
                    :class="username.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
                    :disabled="!username.trim()"
                  >
                    Save
                  </button>
                </div>
              </div>

              <!-- Email Field -->
              <div class="bg-white rounded-lg shadow-md p-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="email"
                    class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    :disabled="!isEditingEmail"
                    v-model="email"
                  />
                  <button 
                    v-if="!isEditingEmail" 
                    @click="toggleEdit('email')"
                    class="text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    v-if="isEditingEmail" 
                    @click="saveChanges('email')"
                    class="px-4 py-2 rounded-md text-white transition-colors"
                    :class="email.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
                    :disabled="!email.trim()"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-md p-4">
                <div class="flex justify-between items-center">
                  <router-link 
                    to="/password" 
                    class="text-indigo-500 hover:text-indigo-700 hover:underline flex items-center space-x-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Change Password</span>
                  </router-link>
                  
                  <button 
                    @click="deleteAccount"
                    class="text-red-500 hover:text-red-700 hover:underline flex items-center space-x-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Popup Modal -->
    <transition name="fade">
      <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="relative bg-white rounded-lg shadow-2xl px-8 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100">
          <!-- Header with color -->
          <div class="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-lg"></div>
          
          <!-- Icon and message -->
          <div class="mt-4 mb-2 flex flex-col items-center">
            <div class="bg-red-100 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-lg font-medium text-gray-800">{{ popupMessage }}</p>
          </div>
          
          <!-- Action button -->
          <button 
            @click="closePopup" 
            class="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>