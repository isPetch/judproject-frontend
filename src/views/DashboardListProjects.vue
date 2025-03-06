<script setup>
import { ref, onMounted } from 'vue'; 
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getAllProjects } from "../composable/getJudProjects";

const projects = ref([]);
const fetchProjects = async () => {
  const response = await getAllProjects(); 
  if (response.status === 'Success') {
    projects.value = response.data; 
    console.log(projects.value)
  } else {
    console.error('Error fetching projects:', response.message);
  }
};
onMounted(fetchProjects);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>

<template>
  <div>
    <NavBar />
    <div class="max-w-8xl mx-auto p-6 pt-20">
      <h2 class="text-2xl font-semibold mb-4">Dashboard</h2>

      <!-- Project Overview -->
      <section>
        <h3 class="text-lg font-semibold mb-2">Project Overview</h3>

        <div v-if="projects.length === 0" class="text-gray-500 text-center py-4">
          No Projects Available
        </div>

        <div v-else class="space-y-4">
          <div v-for="project in projects" :key="project.name" class="bg-gray-100 p-4 rounded-lg">
            <h4 class="font-semibold">{{ project.name }}</h4>
            <p class="text-sm text-gray-600">Due Date: {{ project.dueDate ? formatDate(project.dueDate) : '-' }}</p>
            <div class="w-full bg-yellow-300 h-2 rounded mt-2 relative">
              <div class="absolute top-0 left-0 h-2 bg-green-700 rounded" :style="{ width: project.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tasks and Deadlines -->
      <section class="mt-6">
        <h3 class="text-lg font-semibold mb-2">Tasks and Deadlines</h3>
        <div class="space-y-3">
          <div v-for="task in tasks" :key="task.name" class="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
            <div>
              <h4 class="font-semibold">{{ task.name }}</h4>
              <p class="text-sm text-gray-600">Due Date: {{ task.dueDate }}</p>
            </div>
            <span class="font-semibold"
              :class="{
                'text-red-600': task.priority === 'High',
                'text-orange-600': task.priority === 'Medium',
                'text-green-600': task.priority === 'Low',
              }"
            >
              {{ task.priority }} Priority
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
 
<style scoped>

</style>