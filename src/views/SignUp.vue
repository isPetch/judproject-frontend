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

const addNewUser = ref({
    username: '',
    password: '',
    email: ''
})

const goToLogin = () => {
  router.push({ name: 'Login' });
};

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

const addUser = async (use) => {
    try {
        const formData = new FormData();
        formData.append("username", use.username);
        formData.append("password", use.password);
        formData.append("email", use.email);

        const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/register", {
            method: 'POST',
            headers: {
                'Authorization': id  
            },
            body: formData
        });

        const result = await res.json();

        if (result && result.status === 'Success') {
            console.log('User Data:', result);
            goToLogin();
        } else {
            if (result.message.includes("Duplicate entry") && result.message.includes("user.username")) {
                alert("This username is already taken. Please choose another name.");
            } else if (result.message.includes("Duplicate entry") && result.message.includes("user.email")) {
                alert("This email is already taken.");
            } else {
                console.error(result.message);
            }
        }
    } catch (err) {
        console.log("เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่:", err);
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
      <div v-if="Status" class="text-orange-500">
        <div class="ann-error-username">{{ Status }}</div>
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
      <div v-if="Status" class="text-orange-500">
        <div class="error-email">{{ Status }}</div>
      </div>
    </div>
    <!-- Password Input -->
    <div class="w-full">
      <label for="password" class="block text-gray-600 font-medium">Password</label>
      <input v-model="addNewUser.password"
        type="password"
        id="password"
        placeholder="Enter your password"
        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        maxlength="45" required @keydown="preventSpacebar($event)"
      />
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
    </div>
  </div>
  </template>


<style scoped>

</style>