<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter  } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const isBoardView = ref(false);

const goBoard = () => {
  router.push(`/project/board-${route.params.id}`);
};


const fetchProject = async () => {
  try {
    project.value = await getProjectById(projectId);
    sprints.value = project.value.sprints || [];

    if (sprints.value.length > 0) {
      const savedSprintId = localStorage.getItem(`selectedSprintId_${projectId}`);
      if (savedSprintId) {
        // เลือก Sprint ที่บันทึกไว้เฉพาะสำหรับ project นี้
        handleSprintSelection(savedSprintId);
      } else {
        // หากไม่มี Sprint ที่เลือกไว้ ให้เลือก Sprint ล่าสุด
        handleSprintSelection(sprints.value[sprints.value.length - 1].id);
      }
    }
  } catch (error) {
    console.error("Error fetching project:", error);
  }
};

const isLoading = ref(false);
// โหลดข้อมูล Sprint และ Tasks
const fetchSprint = async (sprintId) => {
  isLoading.value = true;
  try {
    selectedSprint.value = await getSprintById(sprintId);
    tasks.value = selectedSprint.value.tasks || [];
  } catch (error) {
    console.error("Error fetching sprint:", error);
  } finally {
    isLoading.value = false;
  }
};

// อัปเดต Task Board เมื่อเลือก Sprint ใหม่
const handleSprintSelection = (sprintId) => {
  fetchSprint(sprintId);
  localStorage.setItem(`selectedSprintId_${projectId}`, sprintId);  // เก็บค่า Sprint ที่เลือกใน localStorage โดยใช้ projectId เป็นคีย์
};

onMounted(() => {
  fetchProject();

  // ดึงข้อมูล Sprint ที่เลือกก่อนหน้าเฉพาะสำหรับ project นี้
  const savedSprintId = localStorage.getItem(`selectedSprintId_${projectId}`);
  if (savedSprintId) {
    handleSprintSelection(savedSprintId);  // เลือก Sprint ที่เก็บไว้
  } else {
    // หากไม่มี Sprint ที่เลือกไว้ ให้เลือก Sprint ล่าสุด
    if (sprints.value.length > 0) {
      handleSprintSelection(sprints.value[sprints.value.length - 1].id);
    }
  }
});

const addSprint = async () => {
  if (projectId) {
    try {
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/sprint/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result && result.status === 'success') {
        console.log('Sprint Created:', result.data);
        // เพิ่ม sprint ใหม่ลงใน selectedProject.sprints โดยตรงเพื่อให้แสดงผลทันที
        project.value.sprints.push(result.data); 
        // เรียกฟังก์ชัน viewProjectSprints เพื่อดึงข้อมูล sprint ใหม่
        await fetchProject(); // ดึงข้อมูลโปรเจกต์ใหม่เพื่ออัปเดต UI
      } else {
        console.error('Error creating sprint:', result.message);
      }
    } catch (error) {
      console.error('Error creating sprint:', error.message);
    }
  } else {
    console.error('No project selected');
  }
};

</script>
 
<template>
    <div class="h-screen flex flex-col bg-[#4380BC]">
      <NavBar />
      <div v-if="isLoading">Loading...</div>
      
      <div class="flex flex-1 pt-16">
        <!-- Sidebar -->
        <aside class="w-64 bg-[#3C70A3] text-white p-4">
          <h2 class="text-lg font-semibold mb-4">{{ project?.name }}</h2>
          <div class="flex flex-row justify-between">
              <h3 class="text-md font-medium mb-2">Sprints</h3>
              <button class=" text-md font-semibold" @click="addSprint">+</button>
          </div>
          <ul>
            <li
              v-for="sprint in sprints"
              :key="sprint.id"
              @click="handleSprintSelection(sprint.id)"
              class="p-2 rounded cursor-pointer transition-all duration-200 text-start pl-6"
              :class="sprint.id === selectedSprint?.id ? 'bg-blue-500' : 'bg-[#3C70A3] hover:bg-blue-600'"
            >
              Sprint {{ sprint.sprintNumber }}
            </li>
          </ul>
        </aside>
  
        <!-- Task Board -->
        <div v-if="selectedSprint" class="flex-1 p-6">
          <div class="flex flex-row justify-between">
            <h2 v-if="selectedSprint" class="text-2xl font-semibold mb-4 text-white">
              Sprint {{ selectedSprint.sprintNumber }}
            </h2>
            <div class="flex items-center justify-center mb-4">
              <div class="relative w-44">
                <div class="w-full h-10 bg-[#316394] rounded-full flex items-center">
                  <div class="absolute top-1 left-1 w-1/2 h-8 bg-white rounded-full shadow-md transition-transform duration-300"
                    :class="{ 'translate-x-20': !isBoardView }"></div>
                  <button
                    class="z-10 flex-1 text-center text-sm font-semibold transition-all"
                    :class="isBoardView ? 'text-[#144251]' : 'text-gray-300'"
                    @click="goBoard"
                  > Board
                  </button>
                  <button
                    class="z-10 flex-1 text-center text-sm font-semibold transition-all"
                    :class="!isBoardView ? 'text-[#144251]' : 'text-gray-300'"
                    @click="isBoardView = false" 
                  > Team Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
  

        </div>
      </div>

    </div>
  </template>
 
<style scoped>

</style>