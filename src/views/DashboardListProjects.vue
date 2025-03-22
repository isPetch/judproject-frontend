<script setup>
import { ref, onMounted, computed } from 'vue'; 
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getAllProjects } from "../composable/getJudProjects";

const router = useRouter();
const projects = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

// ข้อมูลสรุป
const dashboardStats = ref({
  totalProjects: 0,
  completedProjects: 0,
  upcomingDeadlines: 0,
  averageProgress: 0
});

// ข้อมูลตัวอย่างงาน (ควรใช้ API จริงในการดึงข้อมูล)
const tasks = ref([
  { id: 1, name: 'Design UI Components', dueDate: '28 Mar 2025', priority: 'High', status: 'In Progress', project: 'Project Alpha' },
  { id: 2, name: 'Backend Integration', dueDate: '2 Apr 2025', priority: 'Medium', status: 'Not Started', project: 'Project Alpha' },
  { id: 3, name: 'QA Testing', dueDate: '10 Apr 2025', priority: 'Low', status: 'Not Started', project: 'Project Beta' }
]);

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const response = await getAllProjects(); 
    if (response.status === 'Success') {
      projects.value = response.data; 
      updateDashboardStats();
      console.log(projects.value);
    } else {
      console.error('Error fetching projects:', response.message);
    }
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateDashboardStats = () => {
  if (projects.value.length > 0) {
    dashboardStats.value = {
      totalProjects: projects.value.length,
      completedProjects: projects.value.filter(p => p.progress === 100).length,
      upcomingDeadlines: projects.value.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length,
      averageProgress: Math.round(
        projects.value.reduce((acc, curr) => acc + curr.progress, 0) / projects.value.length
      )
    };
  }
};

// คำนวณสถานะโครงการ
const getProjectStatus = (project) => {
  const today = new Date();
  const dueDate = new Date(project.dueDate);
  
  if (project.progress === 100) return { text: 'Completed', color: 'bg-green-100 text-green-800' };
  if (dueDate < today) return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
  
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return { text: 'Due Soon', color: 'bg-orange-100 text-orange-800' };
  
  return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
};

// กรองโครงการตามการค้นหา
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projects.value;
  
  const query = searchQuery.value.toLowerCase();
  return projects.value.filter(project => 
    project.name.toLowerCase().includes(query) || 
    project.description.toLowerCase().includes(query)
  );
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getProgressColor = (progress) => {
  if (progress < 25) return 'bg-red-500';
  if (progress < 50) return 'bg-orange-500';
  if (progress < 75) return 'bg-yellow-500';
  return 'bg-green-600';
};

const navigateToProject = (projectId) => {
  router.push(`/project/board-${projectId}`);
};

onMounted(fetchProjects);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    
    <div class="dashboard-container">
      <div class="max-w-7xl mx-auto p-4 sm:p-6 pt-16">
        <!-- ส่วนหัวหน้า Dashboard -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Project Dashboard</h1>
            <p class="text-gray-600">Track your projects and upcoming deadlines</p>
          </div>
          <div class="mt-4 md:mt-0">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search projects..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg class="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- สรุปสถิติ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p class="text-sm text-gray-500 font-medium">Total Projects</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboardStats.totalProjects }}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <p class="text-sm text-gray-500 font-medium">Completed Projects</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboardStats.completedProjects }}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
            <p class="text-sm text-gray-500 font-medium">Upcoming Deadlines</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboardStats.upcomingDeadlines }}</p>
          </div>
          <div class="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <p class="text-sm text-gray-500 font-medium">Average Progress</p>
            <p class="text-2xl font-bold text-gray-900">{{ dashboardStats.averageProgress }}%</p>
          </div>
        </div>

        <!-- แสดงข้อมูลโครงการ -->
        <div class="bg-white rounded-xl shadow mb-6">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">Project Overview</h2>
          </div>
          
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          
          <div v-else-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">No Projects Found</h3>
            <p class="mt-1 text-gray-500">{{ searchQuery ? 'Try adjusting your search terms' : 'Start by creating your first project' }}</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="project in filteredProjects" :key="project.id" 
                    @click="navigateToProject(project.id)"
                    class="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ project.name }}</div>
                        <div class="text-sm text-gray-500 truncate max-w-xs">{{ project.description }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(project.startDate) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(project.dueDate) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full" :class="getProjectStatus(project).color">
                      {{ getProjectStatus(project).text }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-xs">
                        <div class="h-2.5 rounded-full" :class="getProgressColor(project.progress)" :style="{ width: project.progress + '%' }"></div>
                      </div>
                      <span class="text-sm text-gray-700">{{ project.progress }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- งานที่กำลังดำเนินการ -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- รายการงาน -->
          <div class="bg-white rounded-xl shadow">
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Upcoming Tasks</h2>
            </div>
            <div class="p-4">
              <div v-if="tasks.length === 0" class="text-gray-500 text-center py-4">
                No Tasks Available
              </div>
              <div v-else class="space-y-3">
                <div v-for="task in tasks" :key="task.id" 
                    class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-medium text-gray-900">{{ task.name }}</h4>
                      <p class="text-sm text-gray-500">{{ task.project }}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full"
                      :class="{
                        'bg-red-100 text-red-800': task.priority === 'High',
                        'bg-orange-100 text-orange-800': task.priority === 'Medium',
                        'bg-green-100 text-green-800': task.priority === 'Low',
                      }"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-sm text-gray-500">Due: {{ task.dueDate }}</span>
                    <span class="text-sm font-medium"
                      :class="{
                        'text-blue-600': task.status === 'In Progress',
                        'text-gray-500': task.status === 'Not Started',
                        'text-green-600': task.status === 'Completed',
                      }"
                    >
                      {{ task.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- กิจกรรมล่าสุด (จำลองข้อมูล) -->
          <div class="bg-white rounded-xl shadow">
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div class="p-4">
              <div class="space-y-4">
                <div class="flex">
                  <div class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">New Sprint Started</p>
                    <p class="text-sm text-gray-500">Project Alpha - Sprint 1</p>
                    <p class="text-xs text-gray-400 mt-1">Today, 10:30 AM</p>
                  </div>
                </div>
                
                <div class="flex">
                  <div class="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">Task Completed</p>
                    <p class="text-sm text-gray-500">Setup Project Structure</p>
                    <p class="text-xs text-gray-400 mt-1">Yesterday, 3:45 PM</p>
                  </div>
                </div>
                
                <div class="flex">
                  <div class="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">Deadline Approaching</p>
                    <p class="text-sm text-gray-500">Design UI Components (2 days left)</p>
                    <p class="text-xs text-gray-400 mt-1">Mar 21, 2025, 9:15 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
 
<style scoped>
.rounded-xl {
  border-radius: 0.75rem;
}

.shadow {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

table {
  border-collapse: separate;
  border-spacing: 0;
}

table tr:last-child td:first-child {
  border-bottom-left-radius: 0.75rem;
}

table tr:last-child td:last-child {
  border-bottom-right-radius: 0.75rem;
}

/* แก้ไขปัญหา NavBar บังเนื้อหา */
.dashboard-container {
  padding-top: 70px; /* ปรับค่านี้ตามความสูงของ NavBar */
}
</style>