<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getAllProjects, getProjectById } from "../composable/getJudProjects";

const router = useRouter();
const projects = ref([]);
const selectedProject = ref(null);
const searchQuery = ref('');
const isLoading = ref(true);
const isMenuOpen = ref(false);
const sortOption = ref('newest'); // อาจเป็น 'newest', 'oldest', 'name'

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const response = await getAllProjects();
    projects.value = response?.data || [];
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  } finally {
    isLoading.value = false;
  }
};

const selectProject = async (id) => {
  isLoading.value = true;
  try {
    selectedProject.value = await getProjectById(id);
  } catch (error) {
    console.error("Failed to fetch project details:", error);
  } finally {
    isLoading.value = false;
  }
};

const clearSelection = () => {
  selectedProject.value = null;
};

const goToProjectDetail = (id) => {
  router.push(`/project/board-${id}`);
};

const filteredProjects = computed(() => {
  let filtered = projects.value;
  
  // กรอง project ด้วย search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      project.name.toLowerCase().includes(query) || 
      project.description.toLowerCase().includes(query)
    );
  }
  
  // เรียงลำดับ
  return [...filtered].sort((a, b) => {
    if (sortOption.value === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortOption.value === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortOption.value === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
});

// กรองเฉพาะโปรเจกต์ที่ยังไม่ถูกเลือก
const remainingProjects = computed(() => {
  return selectedProject.value
    ? filteredProjects.value.filter(p => p.id !== selectedProject.value.id)
    : filteredProjects.value;
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// คำนวณสถานะของโปรเจคเทียบกับ due date
const getStatusColor = (dueDate, status) => {
  if (status === 'Completed') return 'bg-green-100 text-green-800';
  if (!dueDate) return 'bg-gray-100 text-gray-800';
  
  const today = new Date();
  const due = new Date(dueDate);
  const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return 'bg-red-100 text-red-800';
  if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-800';
  return 'bg-blue-100 text-blue-800';
};

const getDaysRemaining = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)} days`;
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return 'Due tomorrow';
  return `${daysRemaining} days remaining`;
};

onMounted(fetchProjects);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <div class="navbar-wrapper">
      <div class="max-w-7xl mx-auto p-4 sm:p-6 pt-20">
        <!-- ส่วนหัว -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 class="text-3xl font-bold text-gray-800">Your Projects</h2>
            <p class="text-gray-500 mt-1">Manage and track all your team projects</p>
          </div>
          <router-link to="/create" class="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Create New Project
          </router-link>
        </div>
        
        <!-- ช่องค้นหาและการเรียงลำดับ -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div class="relative w-full sm:w-64">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search projects..."
              class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span class="text-gray-600">Sort by:</span>
            <select 
              v-model="sortOption" 
              class="border border-gray-300 rounded-md py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- สถานะการโหลด -->
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <!-- ไม่มีโปรเจกต์ -->
        <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-4 text-xl font-medium text-gray-700">No projects yet</h3>
          <p class="mt-1 text-gray-500">Create your first project to get started</p>
          <router-link to="/create" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
            Create Project
          </router-link>
        </div>

        <!-- ไม่พบโปรเจกต์ที่ค้นหา -->
        <div v-else-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="mt-4 text-xl font-medium text-gray-700">No matching projects</h3>
          <p class="mt-1 text-gray-500">Try a different search term</p>
          <button @click="searchQuery = ''" class="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md">
            Clear Search
          </button>
        </div>

        <!-- Layout เปลี่ยนตามการเลือกโปรเจกต์ -->
        <div v-else :class="selectedProject ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'">
          
          <!-- โปรเจกต์ที่เหลือ -->
          <div :class="selectedProject ? 'col-span-1 md:col-span-2' : 'col-span-full'">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                v-for="project in remainingProjects" 
                :key="project.id" 
                @click="selectProject(project.id)"
                class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer border border-gray-100"
              >
                <!-- Header with status -->
                <div class="p-4 border-b border-gray-100">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-800 line-clamp-1">{{ project.name }}</h3>
                    <span :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.dueDate, project.status)}`">
                      {{ project.status || 'Active' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 line-clamp-2">{{ project.description || 'No description' }}</p>
                </div>
                
                <!-- Footer with metadata -->
                <div class="px-4 py-3 bg-gray-50 text-xs text-gray-600">
                  <div class="flex justify-between items-center">
                    <div>
                      <span v-if="project.recentSprint !== null">
                        Sprint {{ project.recentSprint.sprintNumber }}
                      </span>
                      <span v-else>No sprints</span>
                    </div>
                    <div v-if="project.dueDate" class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatDate(project.dueDate) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- รายละเอียดโปรเจกต์ที่เลือก -->
          <div v-if="selectedProject" class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 sticky top-24 md:col-span-1">
            <div class="p-6">
              <!-- Header -->
              <div class="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-800">{{ selectedProject.name }}</h3>
                <div class="flex items-center gap-2">
                  <!-- Dropdown menu -->
                  <div class="relative">
                    <button @click="isMenuOpen = !isMenuOpen" class="p-2 rounded-full hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    <div v-if="isMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div class="py-1">
                        <router-link to="/edit" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Project
                        </router-link>
                        <button class="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Leave Project
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Close button -->
                  <button @click="clearSelection" class="p-2 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Status badge -->
              <div class="my-4">
                <span :class="`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.dueDate, selectedProject.status)}`">
                  {{ selectedProject.status || 'Active' }}
                  <span v-if="selectedProject.dueDate" class="ml-2 text-xs">
                    {{ getDaysRemaining(selectedProject.dueDate) }}
                  </span>
                </span>
              </div>
              
              <!-- Description -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-500 mb-1">Description</h4>
                <p class="text-gray-700 whitespace-pre-wrap break-words">{{ selectedProject.description || 'No description provided.' }}</p>
              </div>
              
              <!-- Details -->
              <div class="space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                  <p class="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ selectedProject.dueDate ? formatDate(selectedProject.dueDate) : 'No due date set' }}
                  </p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-1">Sprints</h4>
                  <p class="flex items-center text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {{ selectedProject.sprints && selectedProject.sprints.length ? `Sprint ${selectedProject.sprints.length}` : 'No sprints' }}
                  </p>
                </div>
                
                <div>
                  <h4 class="text-sm font-medium text-gray-500 mb-1">Team Members</h4>
                  <div class="flex -space-x-2 overflow-hidden">
                    <!-- สมมติว่ามีข้อมูลสมาชิก -->
                    <div v-if="selectedProject.members && selectedProject.members.length">
                      <div v-for="(member, index) in selectedProject.members.slice(0, 5)" :key="index" 
                        class="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {{ member.name ? member.name.charAt(0) : 'U' }}
                      </div>
                      <div v-if="selectedProject.members.length > 5" 
                        class="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{{ selectedProject.members.length - 5 }}
                      </div>
                    </div>
                    <div v-else class="text-gray-500">No team members assigned</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div class="flex justify-between gap-2">
                <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center gap-1 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </button>
                <button 
                  @click="goToProjectDetail(selectedProject.id)" 
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-1 flex items-center justify-center gap-1 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Project
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
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.navbar-wrapper {
  padding-top: 70px;/* เพิ่ม padding ด้านบนเพื่อชดเชย NavBar */
}


.sticky {
  position: sticky;
  z-index: 10; /* กำหนด z-index ต่ำกว่า NavBar */
  height: max-content;
}
</style>