<script setup>
import { ref, watch, computed } from 'vue'
import { RouterView } from 'vue-router'
import { getUserById } from "../composable/getJudProjects";
import { useRouter } from 'vue-router';

const router = useRouter();

const id = localStorage.getItem('userId') || '';
const email = ref('')
const Status = ref('');
const passwordLength = computed(() => addNewUser.value.password.length);
// Add new ref for password visibility state
const showPassword = ref(false);

const addNewUser = ref({
    username: '',
    password: '',
    email: ''
})

const goToLogin = () => {
  router.push({ name: 'Login' });
};

const isUsernameValid = computed(() => {
  return addNewUser.value.username.length >= 5 && addNewUser.value.username.length <= 45;
});

const isEmailValid = computed(() => {
    const emailRegex = /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/;
    return emailRegex.test(addNewUser.value.email);
});

const isPasswordValid = computed(() => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%^#&*()_+{}\[\]:;<>,.?/~\\|-])[\S]{8,14}$/;
    return passwordRegex.test(addNewUser.value.password);
});

// Updated check for password length
const isPasswordLengthValid = computed(() => {
    return passwordLength.value >= 8 && passwordLength.value <= 14;
});

const popupMessage = ref('');
const showPopup = ref(false);

const showPopupError = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
  popupMessage.value = '';
};

// Function to toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const addUser = async (use) => {
    try {
        const formData = new FormData();
        formData.append("username", use.username);
        formData.append("password", use.password);
        formData.append("email", use.email);

        const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/register", {
            method: 'POST',
            body: formData
        });

        const result = await res.json();
        if (result.status === 400 && result.detail && result.detail.includes("Duplicate entry")) {
            if (result.detail.includes("user.email")) {
                Status.value = "This email is already taken.";
                showPopupError(Status.value);
            } else if (result.detail.includes("user.username")) {
                Status.value = "This username is already taken.";
                showPopupError(Status.value);
            }
        } else if (result && result.status === 'Success') {
            goToLogin();
        } else {
            Status.value = "Please fill out the form correctly. Please try again.";
            showPopupError(Status.value);
        }
    } catch (err) {
        console.error("Error in registration:", err);
        Status.value = "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่";
        showPopupError(Status.value);
    }
};

// Updated watcher logic to check password and length validation
const isFieldAdd = computed(() => {
    return addNewUser.value.username !== '' &&
           addNewUser.value.email !== '' &&
           isEmailValid.value &&
           addNewUser.value.password !== '' &&
           isPasswordValid.value &&
           isPasswordLengthValid.value;
});

const preventSpacebar = (event) => {
    if (event.key === ' ' && event.target.value.trim() === '') {
        event.preventDefault(); // Prevent spacebar at the beginning of input
    }
};

const goBack = () => {
  router.push('/');
};
</script>
<template>
<div class="w-screen h-screen bg-white flex flex-col">
  <div class="absolute top-4 left-4">
      <button 
        @click="goBack" 
        class="flex items-center text-[#316394] hover:text-blue-800 transition duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>
    </div>
    <!-- Main Content -->
    <div class="flex flex-grow justify-center items-center pt-20">
      <div class="bg-gray-100 w-[900px] flex shadow-lg rounded-lg overflow-hidden">
        <!-- Left Side: Form -->
        <div class="w-1/2 p-6 flex flex-col">
          <div class="flex justify-center mb-4">
            <img src="../components/image/jubprojectLogo.png" class="w-20 h-20" />
          </div>
          <h2 class="text-3xl font-bold text-center mb-6">Create Account</h2>
          <div class="space-y-4">
            <!-- Username Input -->
            <div class="w-full">
              <label for="username" class="block text-gray-600 font-medium">Username</label>
              <input v-model="addNewUser.username"
                type="text"
                id="username"
                placeholder="Enter your username"
                class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                maxlength="45" required @keydown="preventSpacebar($event)"
              />
              <div v-if="addNewUser.username !== '' && !isUsernameValid" class="text-orange-500">
                Username must be at least 5 characters long.
              </div>
            </div>
            <!-- Email Input -->
            <div class="w-full">
              <label for="email" class="block text-gray-600 font-medium">Email</label>
              <input v-model="addNewUser.email"
                type="email"
                id="email"
                placeholder="Enter your email"
                class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                maxlength="45" required @keydown="preventSpacebar($event)"
              />
              <div v-if="addNewUser.email !== '' && !isEmailValid" class="text-orange-500">
                Please enter a valid email address
              </div>
            </div>
            <!-- Password Input with Toggle Visibility -->
            <div class="w-full">
              <label for="password" class="block text-gray-600 font-medium">Password</label>
              <div class="relative">
                <input v-model="addNewUser.password"
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  placeholder="Enter your password"
                  class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  maxlength="45" required @keydown="preventSpacebar($event)"
                />
                <!-- Eye icon for password visibility toggle -->
                <button 
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center mt-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <!-- Eye open when password is visible -->
                  <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                  <!-- Eye closed when password is hidden -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                </button>
              </div>
              <div v-if="!isPasswordValid && addNewUser.password !== ''" class="text-orange-500 error-password">
                Password must be 8-14 characters long, including at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
              </div>
              <div v-if="passwordLength < 8" class="text-orange-500 error-password">
                Password size must be between 8 and 14 characters
              </div>
            </div>
          </div>
          <button class="w-full mt-6 py-2 text-white font-semibold rounded-md hover:bg-blue-700" 
          :disabled="!isFieldAdd"
          :class="{
            'cursor-not-allowed bg-gray-300 text-gray-400': !isFieldAdd,
            ' bg-[#316394] text-black': isFieldAdd
          }"
          @click="addUser(addNewUser)">Sign Up</button>
          <p class="text-center text-sm text-gray-500 mt-4">Already have an account? <router-link to="/login" class="text-blue-600">Log in</router-link></p>
        </div>
        
        <!-- Right Side: Image -->
        <div class="w-1/2 bg-[#316394] flex justify-center items-center">
          <img src="../components/image/clipboard.png" class="w-3/4" />
        </div>
      </div>
    <transition name="fade">
      <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="relative bg-white rounded-lg shadow-2xl px-8 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100">
          <!-- Header with color based on message type -->
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
  </div>
</template>


<style scoped>
/* Your existing styles */
</style>