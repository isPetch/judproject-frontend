<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getAllProjects, getProjectById } from "../composable/getJudProjects";

const router = useRouter();
const projects = ref([]);
const selectedProject = ref(null);

const fetchProjects = async () => {
  const response = await getAllProjects();
  projects.value = response?.data || []; // ดึงข้อมูลจาก response.data
};

const selectProject = async (id) => {
  selectedProject.value = await getProjectById(id);
};

const clearSelection = () => {
  selectedProject.value = null; // เคลียร์การเลือก
};

const goToProjectDetail = (id) => {
  router.push(`/project/board-${id}`);
};

// กรองเฉพาะโปรเจกต์ที่ยังไม่ถูกเลือก
const remainingProjects = computed(() => {
  return selectedProject.value
    ? projects.value.filter(p => p.id !== selectedProject.value.id)
    : projects.value;
});

onMounted(fetchProjects);
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
const isMenuOpen = ref(false);

</script>

<template>
  <div>
    <NavBar />
    <div class="max-w-8xl mx-auto p-6 pt-20">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">Dashboard</h2>
         <router-link to="/create" class="btn text-white bg-blue-500 px-4 py-2 rounded">
  + Create New Project
</router-link>
      </div>
      <!-- Layout เปลี่ยนตามการเลือกโปรเจกต์ -->
      <div :class="selectedProject ? 'grid grid-cols-2 gap-4 items-start' : 'grid grid-cols-2 gap-4'">
        
        <!-- ด้านซ้าย -->
        <div :class="selectedProject ? 'col-span-1 grid grid-cols-1 gap-4' : 'col-span-2 grid grid-cols-2 gap-4'">
          <div 
            v-for="project in remainingProjects" 
            :key="project.id" 
            @click="selectProject(project.id)"
            class="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200"
          >
            <h3 class="text-lg font-semibold text-[#144251]">{{ project.name }}</h3>
            <p class="text-sm text-[#2A728A] break-words whitespace-pre-wrap">{{ project.description }}</p>
          </div>
        </div>

        <!-- ด้านขวา: แสดงรายละเอียดโปรเจกต์ที่เลือก -->
        <div class="bg-white p-6 rounded-lg shadow-md min-h-0 overflow-auto" v-if="selectedProject">
  <div class="flex items-center justify-between">
    <span class="text-xl font-semibold text-[#144251]">{{ selectedProject.name }}</span>
    <div class="flex items-center gap-2">
    <!-- ปุ่มเปิดเมนู -->
<div class="dropdown dropdown-end">
  <button @click="isMenuOpen = !isMenuOpen" >
    <div class="w-10 rounded-full">
      <img src="../components/icon/List.png" alt="list" class="h-6 w-6" />
    </div>
  </button>

  <!-- Dropdown Menu -->
  <ul v-show="isMenuOpen" class="menu menu-sm dropdown-content bg-gray-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
    <li>
      <router-link to="/edit" class="justify-between font-bold text-lg">Edit Project
           <img src="../components/icon/edit.png" class="h-5 w-5" />
      </router-link>
    </li>
    <li><a class="text-red-500 font-bold text-lg justify-between">Leave
      <img src="../components/icon/logout.png" class="h-5 w-5" />
    </a></li>
  </ul>
</div>
      <button><img src="../components/icon/MakiCross.png" alt="clearSelection" class="h-6 w-6" @click="clearSelection"/></button>
    </div>
  </div>
          <p class="text-[#2A728A]  break-words whitespace-pre-wrap">{{ selectedProject.description }}</p>
          <div class="mt-4 text-[#A39898]">
            <p>📅 <strong>Due date:</strong> {{ selectedProject.dueDate ? formatDate(selectedProject.dueDate) : '-' }}</p>
            <p>🚀 <strong>Current Sprint:</strong> {{ selectedProject.sprints.length }}</p>
            <p>🔘 <strong>Status:</strong> 
              <span v-if="selectedProject.status === 'Active'">🟢 Active</span>
              <span v-else-if="selectedProject.status === 'Completed'">✅ Completed</span>
              <span v-else>❌ Unknown</span>
            </p>
            <p>👥 <strong>Members:</strong></p>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 bg-yellow-500 text-white rounded-lg">Move to archive</button>
            <button class="px-4 py-2 bg-green-500 text-white rounded-lg" @click="goToProjectDetail(selectedProject.id)">View</button>
          </div>
        </div>

      </div>
    </div>
  </div>

    
  
</template>


<style scoped>
.cursor-pointer {
  transition: background-color 0.2s ease-in-out;
}
</style>
