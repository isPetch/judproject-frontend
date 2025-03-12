<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import ModalTask from "@/components/ModalTask.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";

const route = useRoute();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const selectedTask = ref(null);  // Store the selected task for the modal
const isModalVisible = ref(false);  // Control visibility of the modal

// โหลดข้อมูลโปรเจกต์และ Sprint List
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

// โหลดข้อมูล Sprint และ Tasks
const fetchSprint = async (sprintId) => {
  try {
    selectedSprint.value = await getSprintById(sprintId);
    tasks.value = selectedSprint.value.tasks || [];
  } catch (error) {
    console.error("Error fetching sprint:", error);
  }
};

// อัปเดต Task Board เมื่อเลือก Sprint ใหม่
const handleSprintSelection = (sprintId) => {
  fetchSprint(sprintId);
  localStorage.setItem(`selectedSprintId_${projectId}`, sprintId);  // เก็บค่า Sprint ที่เลือกใน localStorage โดยใช้ projectId เป็นคีย์
};

const openTaskDetails = (task) => {
  selectedTask.value = task;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  selectedTask.value = null;
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
      <div class="flex-1 p-6">
        <h2 v-if="selectedSprint" class="text-2xl font-semibold mb-4 text-white">
          Sprint {{ selectedSprint.sprintNumber }}
        </h2>

        <div class="grid grid-cols-3 gap-6">
          <div class="bg-white p-4 rounded shadow">
            <h3 class="text-lg font-semibold mb-3">TO DO</h3>
            <div
              v-for="task in tasks.filter(t => t.status === 'ToDo')"
              :key="task.id"
              class="bg-[#EAEBF1] p-3 rounded mb-2 shadow-sm text-md font-semibold cursor-pointer hover:bg-gray-300 transition-all"
              @click="openTaskDetails(task)">
              {{ task.name }}
            </div>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <h3 class="text-lg font-semibold mb-3">IN PROGRESS</h3>
            <div
              v-for="task in tasks.filter(t => t.status === 'In Progress')"
              :key="task.id"
              class="bg-[#EAEBF1] p-3 rounded mb-2 shadow-sm text-md font-semibold cursor-pointer hover:bg-gray-300 transition-all"
              @click="openTaskDetails(task)">
              {{ task.name }}
            </div>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <h3 class="text-lg font-semibold mb-3">DONE</h3>
            <div
              v-for="task in tasks.filter(t => t.status === 'Done')"
              :key="task.id"
              class="bg-[#EAEBF1] p-3 rounded mb-2 shadow-sm text-md font-semibold cursor-pointer hover:bg-gray-300 transition-all"
              @click="openTaskDetails(task)">
              {{ task.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
 <!-- Modal Component -->
    <ModalTask
      v-if="isModalVisible"
      :task="selectedTask"
      :sprints="sprints"
      :isVisible="isModalVisible"
      :closeModal="closeModal"
    />
  </div>
</template>
