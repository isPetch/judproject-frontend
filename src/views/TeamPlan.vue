<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isDateToday, addMonths } from 'date-fns';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const isBoardView = ref(false);

// Calendar and team plan related refs
const calendarRef = ref(null);
const scrollContainer = ref(null);
const currentDate = ref(new Date());
const dayWidth = ref(40); // Default width before measurement

// Calculate days to display - show current month plus part of next month
const displayDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value);
  const monthEnd = endOfMonth(currentDate.value);
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => ({
    date,
    dateStr: format(date, 'yyyy-MM-dd')
  }));
});

const currentMonthName = computed(() => {
  return format(currentDate.value, 'MMMM yyyy');
});

// Navigation for calendar
const prevMonth = () => {
  const newDate = addMonths(currentDate.value, -1);
  currentDate.value = newDate;
};

const nextMonth = () => {
  const newDate = addMonths(currentDate.value, 1);
  currentDate.value = newDate;
};

// Synchronize scrolling
const handleScroll = (event) => {
  // This function will be called when the container is scrolled
  // No need to do anything as both headers and content will scroll together
};

// Sample team members - this should eventually come from your backend
const teamMembers = ref([]);
const viewProjectMember = async (projectId) => {
  try {
    console.log('Fetching members for project ID:', projectId);
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/project/${projectId}/members`);
    const result = await response.json();
    console.log("API Response:", result);
    if (result && result.status === 'Success') { 
      teamMembers.value = result.members; 
    } else {
      console.error('Error fetching project members:', result.message);
    }
  } catch (error) {
    console.error('Error fetching project members:', error.message);
  }
};

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
  viewProjectMember(projectId);

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

  // Measure the actual width of calendar days after mounting
  if (calendarRef.value) {
    const calendarDays = calendarRef.value.querySelectorAll('.calendar-day');
    if (calendarDays.length > 1) {
      // Calculate the width including any margins
      const firstDay = calendarDays[0];
      const secondDay = calendarDays[1];
      const firstRect = firstDay.getBoundingClientRect();
      const secondRect = secondDay.getBoundingClientRect();
      
      // Update the day width to include margins
      dayWidth.value = secondRect.left - firstRect.left;
    }
  }
});

// Watch for changes to current month to reset scroll position
watch(currentDate, () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = 0;
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

// Task helpers for team plan
const getTasksForMember = (memberId) => {
  // Filter tasks by member ID
  return tasks.value ? tasks.value.filter(task => task.assigneeId === memberId) : [];
};

const isToday = (date) => {
  return isDateToday(date);
};

const getTaskStyle = (task) => {
  // Make sure task has startDate and dueDate properties
  if (!task.startDate || !task.dueDate) {
    return { display: 'none' };
  }
  
  // Convert dates to Date objects
  const startDate = typeof task.startDate === 'string' ? parseISO(task.startDate) : new Date(task.startDate);
  const endDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
  
  // Get the first day of the display period
  const firstDisplayDay = displayDays.value[0].date;
  const lastDisplayDay = displayDays.value[displayDays.value.length - 1].date;
  
  // Only show tasks that have some overlap with the displayed period
  if (endDate < firstDisplayDay || startDate > lastDisplayDay) {
    return { display: 'none' };
  }
  
  // Calculate the effective start date (clamp to first display day if task starts before)
  const effectiveStartDate = startDate < firstDisplayDay ? firstDisplayDay : startDate;
  
  // Calculate days from first display day
  const daysFromStart = differenceInDays(effectiveStartDate, firstDisplayDay);
  
  // Calculate duration in days (including end date)
  // Clamp end date to last display day if task ends after
  const effectiveEndDate = endDate > lastDisplayDay ? lastDisplayDay : endDate;
  const duration = differenceInDays(effectiveEndDate, effectiveStartDate) + 1;
  
  // Calculate left position and width
  const leftPosition = daysFromStart * dayWidth.value;
  const width = duration * dayWidth.value - 4; // Subtract padding
  
  // Use task color or default to a color based on task status
  const backgroundColor = task.color || getColorByStatus(task.status);
  
  return {
    left: `${leftPosition}px`,
    width: `${width}px`,
    backgroundColor
  };
};

// Helper to get color by task status if no color property exists
const getColorByStatus = (status) => {
  const statusColors = {
    'todo': '#f28b82',      // Red for to-do
    'inProgress': '#81c995', // Green for in progress
    'review': '#ffcc66',    // Yellow for review
    'done': '#66a3ff'       // Blue for done
  };
  
  return statusColors[status] || '#f28b82'; // Default to red if status not found
};
</script>
 
<template>
    <div class="h-screen flex flex-col bg-[#4380BC]">
      <NavBar />
      <div v-if="isLoading" class="text-white text-center pt-20">Loading...</div>
      
      <div class="flex flex-1 pt-16">
        <!-- Sidebar -->
        <aside class="w-64 bg-[#3C70A3] text-white p-4">
          <h2 class="text-lg font-semibold mb-4">{{ project?.name }}</h2>
          <div class="flex flex-row justify-between">
              <h3 class="text-md font-medium mb-2">Sprints</h3>
              <button class="text-md font-semibold" @click="addSprint">+</button>
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
        <div v-if="selectedSprint" class="flex-1 p-6 overflow-hidden">
          <div class="flex flex-row justify-between mb-4">
            <h2 v-if="selectedSprint" class="text-2xl font-semibold text-white">
              Sprint {{ selectedSprint.sprintNumber }}
            </h2>
            <div class="flex items-center justify-center">
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

          <!-- Team Plan Calendar View -->
          <div class="bg-white rounded-lg shadow-lg overflow-hidden" v-if="!isBoardView">
            <!-- Month selector -->
            <div class="bg-[#316394] text-white p-3 flex items-center justify-center space-x-4">
              <button @click="prevMonth" class="text-xl hover:bg-blue-600 px-2 py-1 rounded">←</button>
              <span class="text-lg font-medium">{{ currentMonthName }}</span>
              <button @click="nextMonth" class="text-xl hover:bg-blue-600 px-2 py-1 rounded">→</button>
            </div>
            
            <!-- Calendar and tasks content -->
            <div class="flex overflow-x-auto" @scroll="handleScroll" ref="scrollContainer">
              <!-- Fixed column for member names -->
              <div class="sticky left-0 z-10 w-48 bg-white shadow-md">
                <div class="h-10 bg-gray-100"></div> <!-- Empty header cell -->
                <div v-for="member in teamMembers" :key="`fixed-${member.id}`" class="flex items-center p-3 h-16 border-b">
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    {{ member.username.charAt(0) }}
                  </div>
                  <div class="font-medium truncate">{{ member.username }}</div>
                </div>
              </div>
              
              <!-- Scrollable content -->
              <div class="flex-1 min-w-0">
                <!-- Calendar days header -->
                <div class="flex bg-gray-100" ref="calendarRef">
                  <div 
                    v-for="day in displayDays" 
                    :key="day.date" 
                    class="min-w-10 w-10 h-10 flex items-center justify-center text-sm"
                    :class="{ 'bg-blue-500 text-white': isToday(day.date), 'font-bold': day.date.getDate() === 1 }"
                  >
                    {{ day.date.getDate() }}
                  </div>
                </div>
                
                <!-- Team Board with tasks -->
                <div>
                  <div v-for="member in teamMembers" :key="`scroll-${member.id}`" class="relative h-16 border-b">
                    <!-- Background grid for days -->
                    <div class="absolute inset-0 flex">
                      <div 
                        v-for="day in displayDays" 
                        :key="`grid-${day.date}`" 
                        class="min-w-10 w-10 h-full border-r border-gray-100"
                        :class="{ 'border-l-2 border-l-blue-500': day.date.getDate() === 1 }"
                      ></div>
                    </div>
                    
                    <!-- Tasks for this member -->
                    <div 
                      v-for="task in getTasksForMember(member.id)" 
                      :key="task.id"
                      class="absolute top-2 h-12 px-2 text-white text-xs flex items-center rounded"
                      :style="getTaskStyle(task)"
                      :title="task.name"
                    >
                      {{ task.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Placeholder for Board View -->
          <div v-if="isBoardView" class="bg-white rounded-lg p-4">
            <p class="text-gray-500">Board view will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
</template>
 
<style scoped>
/* Calendar specific styles */
.min-w-10 {
  min-width: 2.5rem;
}

/* Fix for scrolling */
.overflow-x-auto {
  overflow-x: auto;
  scrollbar-width: thin;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>