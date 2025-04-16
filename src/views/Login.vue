<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const router = useRouter();


onMounted(() => {
  const token = localStorage.getItem('token');
  const lastLogin = localStorage.getItem('lastLogin');
  const EXPIRATION_TIME = 30 * 60 * 1000;

  if (token && lastLogin) {
    const currentTime = Date.now();
    if (currentTime - lastLogin < EXPIRATION_TIME) {
      router.push('/dashboard');
    }
  }
});

const handleLogin = async () => {
 

  if (!username.value && !password.value) {
  showPopupError('Please enter both username and password.');
  return;
}

if (!username.value) {
  showPopupError('Please enter your username.');
  return;
}

if (!password.value) {
  showPopupError('Please enter your password.');
  return;
}

  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const data = await response.json(); 
    if (data.status === 'Success') {
      localStorage.setItem('token', data.usrtoken); 
      localStorage.setItem('userId', data.usrtoken); 
      localStorage.setItem('lastLogin', Date.now());
      router.push({ name: 'Dashboard' });
    } else {
      showPopupError('Incorrect username or password.');
    }
  } catch (error) {
    showPopupError('Login failed: ' + (error.message || 'An unexpected error occurred'));
  }
};


const showPassword = ref(false);
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const goBack = () => {
  router.push('/');
};


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
    <div class="flex flex-grow justify-center items-center pt-20">
      <div class="flex bg-gray-100 shadow-lg rounded-lg overflow-hidden max-w-4xl w-full">
        <div class="w-1/2 bg-[#316394] p-8 flex justify-center items-center">
          <img src="../components/image/clipboard.png" class="max-w-full h-auto" />
        </div>
        <div class="w-1/2 p-8">
          <div class="text-center">
            <img src="../components/image/jubprojectLogo.png" class="h-20 mx-auto mb-10" />
            <h2 class="text-3xl font-semibold">Welcome Back</h2>
          </div>
          <div class="mt-6">
            <label class="block text-gray-600 font-medium">Username</label>
            <input v-model="username" type="text" placeholder="Enter your username" class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500" />
          </div>
         <div class="mt-4">
  <label class="block text-gray-600 font-medium">Password</label>
  <div class="relative">
    <input 
      :type="showPassword ? 'text' : 'password'"
      v-model="password" 
      placeholder="Enter your password" 
      class="w-full mt-1 p-2 pr-10 border border-gray-300 rounded-md focus:ring focus:ring-blue-500" 
    />
    <!-- Eye icon for password visibility toggle -->
    <button 
      type="button"
      @click="togglePasswordVisibility"
      class="absolute inset-y-0 right-2 mt-1 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
          </div>
          <!-- <div class="text-right mt-2">
            <a href="#" class="text-sm text-gray-500 hover:underline">Forgot password?</a>
          </div> -->
          <button @click="handleLogin" class="w-full mt-4 py-2 text-white bg-[#316394] rounded-md hover:bg-blue-800">Log In</button>
          <div class="text-center text-sm text-gray-500 mt-4">
            Don't have an account yet? <router-link to="/signup" class="text-blue-600 hover:underline">Sign up</router-link>
          </div>
        </div>
         <transition name="fade">
        <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="relative bg-white rounded-lg shadow-2xl px-8 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100">
        <!-- Header bar -->
        <div class="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-lg"></div>

        <!-- Icon + Message -->
        <div class="mt-4 mb-2 flex flex-col items-center">
          <div class="bg-red-100 p-3 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-lg font-medium text-gray-800">{{ popupMessage }}</p>
        </div>

        <!-- Close button -->
        <button @click="closePopup"
          class="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 font-medium">
          Got it
        </button>
      </div>
    </div>
  </transition>
      </div>
    </div>
    </div>
</template>

<style scoped>
</style>
