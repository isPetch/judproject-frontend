<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  {
    icon: '📊',
    title: 'Project Dashboard',
    description: 'Visualize your project progress with intuitive analytics and real-time insights.'
  },
  {
    icon: '⏱️',
    title: 'Time Tracking',
    description: 'Efficiently manage project timelines and monitor task completion rates.'
  }
]

const handleLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f4f7fa] text-gray-900">

    <!-- Hero Section -->
    <div class="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-white">
      <div class="container mx-auto px-4 flex flex-col-reverse md:flex-row items-center">
        <div class="md:w-1/2 text-center md:text-left mt-10 md:mt-0">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#316394]">
            Simplify Your Project Management
          </h1>
          <p class="text-lg md:text-xl mb-8 text-gray-600">
            Jud Project helps you track, collaborate, and deliver exceptional results with ease.
          </p>
          <button 
            @click="handleLogin"
            class="bg-[#316394] text-white px-10 py-3 rounded-full font-semibold hover:bg-[#3a7ac4] transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started
          </button>
        </div>
        <div class="md:w-1/2 flex justify-center mb-8 md:mb-0">
          <img 
            src="../components/image/jubprojectLogo.png" 
            alt="Jud Project Dashboard" 
            class="w-full max-w-[500px] animate-float"
          />
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="container mx-auto px-4 py-16 lg:py-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-[#316394] mb-4">
          Powerful Features
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Designed to empower teams and streamline project workflows with intelligent tools.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 justify-center">
        <div 
          v-for="feature in features" 
          :key="feature.title"
          class="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition duration-300 transform hover:-translate-y-2"
        >
          <div class="text-5xl mb-6 opacity-80">{{ feature.icon }}</div>
          <h3 class="text-xl font-semibold mb-4 text-[#316394]">{{ feature.title }}</h3>
          <p class="text-gray-600">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  h1 {
    font-size: 2.5rem;
  }

  .text-lg {
    font-size: 1rem;
  }
}
</style>