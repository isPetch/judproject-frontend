<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
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
      router.push('/');
    }
  }
});

const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('Please enter username and password.');
    return;
  }
  try {
    const response = await axios.post('http://cp24sy3.sit.kmutt.ac.th:8000/api/login', { 
      username: username.value, 
      password: password.value 
    });

    if (response.data.status === 'Success') {
      localStorage.setItem('token', response.data.usrtoken); 
      localStorage.setItem('userId', response.data.usrtoken);
      localStorage.setItem('lastLogin', Date.now());
      router.push({ name: 'Dashboard' });
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    alert('Login failed: ' + (error.response?.data?.message || 'An error occurred'));
  }
};
</script>

<template>
    <div class="w-screen h-screen bg-white flex flex-col">
    <nav class="bg-[#316394] text-white px-6 py-4 flex items-center">
      <div class="flex items-center space-x-6">
        <img src="../components/image/jubproject.png" class="h-10" />
        <span class="text-lg font-bold">JudProject</span>
        <div class="ml-6 flex space-x-8"> 
          <a href="#" class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300">About</a>
          <a href="#" class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300">Contact</a>
        </div>
      </div>
    </nav>
    <div class="flex flex-grow justify-center items-center p-6">
      <div class="flex bg-gray-200 shadow-lg rounded-lg overflow-hidden max-w-4xl w-full">
        <div class="w-1/2 bg-[#316394] p-8 flex justify-center items-center">
          <img src="../components/image/project-manager.png" class="max-w-full h-auto" />
        </div>
        <div class="w-1/2 p-8">
          <div class="text-center">
            <img src="../components/image/jubproject.png" class="h-20 mx-auto mb-10" />
            <h2 class="text-3xl font-semibold">Welcome Back</h2>
          </div>
          <div class="mt-6">
            <label class="block text-gray-600 font-medium">Username</label>
            <input v-model="username" type="text" placeholder="Enter your username" class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500" />
          </div>
          <div class="mt-4">
            <label class="block text-gray-600 font-medium">Password</label>
            <input v-model="password" type="password" placeholder="Enter your password" class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-500" />
          </div>
          <div class="text-right mt-2">
            <a href="#" class="text-sm text-gray-500 hover:underline">Forgot password?</a>
          </div>
          <button @click="handleLogin" class="w-full mt-4 py-2 text-white bg-[#316394] rounded-md hover:bg-blue-800">Log In</button>
          <div class="text-center text-sm text-gray-500 mt-4">
            Don't have an account yet? <router-link to="/signup" class="text-blue-600 hover:underline">Sign up</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
