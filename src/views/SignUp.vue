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
        const res = await fetch(import.meta.env.VITE_ROOT_API + "/api/register", {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': id
            },
            body: JSON.stringify({
                username: use.username,
                password: use.password,
                email: use.email
            })
        });

        const result = await res.json();

        if (result && result.status === 'Success') {
            console.log('User Data:', result);
            goToLogin();
        } else {
            if (result.message.includes("Duplicate entry") && result.message.includes("user.username")) {
                alert("This username is already taken. Please choose another name.");
            }else if (result.message.includes("Duplicate entry") && result.message.includes("user.email")){
                alert("This email is already taken.");
            }else {
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
</script>
<template>
<div class="w-screen h-screen bg-white flex flex-col">
  <nav class="fixed top-0 left-0 w-full z-50 text-white p-4 flex justify-between items-center" style="background-color: #316394;">
    <div class="flex flex-row items-center space-x-6">
      <div class="flex items-center space-x-2">
      <img src="../components/image/jubproject.png" alt="JudProject Logo" class="h-6 w-6" />
      <span class="text-lg font-bold">JudProject</span>
      <div class="text-sm flex space-x-6"> 
        <a href="#" class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300">About</a>
        <a href="#" class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300">Contact</a>
      </div>
    </div>
    </div>
    <div class="ml-auto">
      <a href="/login" class="text-white px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300">Sign in</a>
    </div>
  </nav>
    <!-- Main Content -->
    <div class="flex flex-grow justify-center items-center pt-20">
      <div class="bg-gray-200 w-[900px] flex shadow-lg rounded-lg overflow-hidden">
        <!-- Left Side: Form -->
        <div class="w-1/2 p-6 flex flex-col">
          <div class="flex justify-center mb-4">
            <img src="../components/image/jubproject.png" class="w-20 h-20" />
          </div>
          <h2 class="text-3xl font-bold text-center mb-6">Create Account</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-gray-600 font-medium">Username</label>
              <input v-model="addNewUser.username" type="text" placeholder="Enter your username" 
                class="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-gray-600 font-medium">Current Password</label>
              <input type="password" placeholder="Enter your current password" 
                class="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-gray-600 font-medium">Old Password</label>
              <input type="password" placeholder="Enter your old password" 
                class="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-gray-600 font-medium">New Password</label>
              <input v-model="addNewUser.password" type="password" placeholder="Enter your new password" 
                class="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500">
            </div>
          </div>
          <button class="w-full mt-6 py-2 bg-[#316394] text-white font-semibold rounded-md hover:bg-blue-700">Sign Up</button>
          <p class="text-center text-sm text-gray-500 mt-4">Already have an account? <router-link to="/login" class="text-blue-600">Sign In</router-link></p>
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