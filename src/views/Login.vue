<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const router = useRouter();

// ตรวจสอบการ login ในหน้า login
onMounted(() => {
  const token = localStorage.getItem('token');
  const lastLogin = localStorage.getItem('lastLogin');
  const EXPIRATION_TIME = 30 * 60 * 1000; // 30 นาที

  if (token && lastLogin) {
    const currentTime = Date.now();
    if (currentTime - lastLogin < EXPIRATION_TIME) {
      router.push('/');
    }
  }
});

const handleLogin = async () => {
  if (!username.value && !password.value) {
    alert('Please enter username and password.');
    return;
  }
  if (!username.value) {
    alert('Please enter username.');
    return;
  }
  if (!password.value) {
    alert('Please enter password.');
    return;
  }
  try {
    const response = await axios.post('http://localhost:8080/api/login', { 
      username: username.value, 
      password: password.value 
    });

    if (response.data.status === 'Success') {
      localStorage.setItem('token', response.data.usrtoken); 
      localStorage.setItem('userId', response.data.usrtoken);
      localStorage.setItem('lastLogin', Date.now()); // บันทึกเวลาล่าสุดที่ login
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
  <div class="w-screen h-screen flex justify-center items-center bg-[#031228]">
  <div class="bg-white w-96 p-8 rounded-lg shadow-lg flex flex-col items-center space-y-6">
    <div class="flex flex-col items-center">
      <img src="../components/image/jubproject.png"  class=" w-24 h-24" />
    </div>
    <hr class="w-full border-gray-300" />
    <!-- Login / Signup Text -->
    <div class="text-center text-3xl font-bold text-gray-700">
      <span class="text-black ">Login /</span>
      <router-link to="/signup" class="text-gray-400 "> Sign Up</router-link>
    </div>
    <!-- Username Input -->
    <div class="w-full">
      <label for="username" class="block text-gray-600 font-medium">Username</label>
      <input
        type="text"
        id="username"
        v-model="username"
        placeholder="Enter your username"
        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
      />
    </div>
    <!-- Password Input -->
    <div class="w-full">
      <label for="password" class="block text-gray-600 font-medium">Password</label>
      <input
        type="password"
        id="password"
        v-model="password"
        placeholder="Enter your password"
        class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
      />
    </div>
    <button @click="handleLogin" class="w-full py-2 text-white bg-black rounded-md hover:bg-gray-800">
      Sign In
    </button>
    <a href="#" class="text-sm text-gray-500 hover:underline">Forgot Password?</a>
  </div>
</div>


</template>

<style scoped>

</style>
