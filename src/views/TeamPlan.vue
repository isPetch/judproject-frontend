<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday as isDateToday,
  addMonths,
} from "date-fns";
import {
  PlusIcon,
  CalendarIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/outline";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const isBoardView = ref(false);
const getSprintStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "bg-blue-500";
    case "Done":
      return "bg-green-500";
    case "Closed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

// Calendar and team plan related refs
const calendarRef = ref(null);
const scrollContainer = ref(null);
const currentDate = ref(new Date());
const dayWidth = ref(40); // Default width before measurement

// Calculate days to display - show current month plus part of next month
const displayDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value);
  const nextMonthEnd = endOfMonth(addMonths(currentDate.value, 1));
  
  return eachDayOfInterval({ start: monthStart, end: nextMonthEnd }).map((date) => ({
    date,
    dateStr: format(date, "yyyy-MM-dd"),
  }));
});
const currentMonthDisplay = computed(() => {
  const startMonth = format(startOfMonth(currentDate.value), "MMMM yyyy");
  const endMonth = format(endOfMonth(addMonths(currentDate.value, 1)), "MMMM yyyy");
  return `${startMonth} - ${endMonth}`;
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

const image = ref(null);
const membersImage = ref([]);
const fetchMemberPicture = async (memberId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_ROOT_API}/api/project/member/${memberId}/picture`,
      {
        method: "GET",
        headers: {  
         "Authorization": token,
         "Content-Type": "application/json"
       },
      }
    );

    console.log("Response Status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch picture, status: ${response.status}`);
    }

    const imageBlob = await response.blob();
    return imageBlob ? URL.createObjectURL(imageBlob) : null;
  } catch (error) {
    console.error("Failed to fetch member picture:", error);

    // กำหนดรูป Default ถ้าโหลดไม่สำเร็จ
    membersImage.value.push = "/images/default-profile.png";
  }
};

// Sample team members - this should eventually come from your backend
const teamMembers = ref([]);
const viewProjectMember = async (projectId) => {
  try {
    console.log("Fetching members for project ID:", projectId);
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_ROOT_API + `/api/project/${projectId}/members`,
      {
        method: "GET",
        headers: { 
          "Authorization": token,
          "Content-Type": "application/json" 
        },
      }
    );
    const result = await response.json();
    console.log("Members:", result);

    if (result && result.status === "Success") {
      const membersWithImages = await Promise.all(
        result.members.map(async (member) => {
          const imageURL = await fetchMemberPicture(member.memberId);
          return { ...member, image: imageURL || "/images/default-profile.png" };
        })
      );
      teamMembers.value = membersWithImages;
    } else {
      console.error("Error fetching project members:", result.message);
    }
  } catch (error) {
    console.error("Error fetching project members:", error.message);
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
    console.log("Tasks:",tasks.va)
  } catch (error) {
    console.error("Error fetching sprint:", error);
  } finally {
    isLoading.value = false;
  }
};

// อัปเดต Task Board เมื่อเลือก Sprint ใหม่
const handleSprintSelection = (sprintId) => {
  fetchSprint(sprintId);
  localStorage.setItem(`selectedSprintId_${projectId}`, sprintId); // เก็บค่า Sprint ที่เลือกใน localStorage โดยใช้ projectId เป็นคีย์
};

onMounted(() => {
  fetchProject();
  viewProjectMember(projectId);

  // ดึงข้อมูล Sprint ที่เลือกก่อนหน้าเฉพาะสำหรับ project นี้
  const savedSprintId = localStorage.getItem(`selectedSprintId_${projectId}`);
  if (savedSprintId) {
    handleSprintSelection(savedSprintId); // เลือก Sprint ที่เก็บไว้
  } else {
    // หากไม่มี Sprint ที่เลือกไว้ ให้เลือก Sprint ล่าสุด
    if (sprints.value.length > 0) {
      handleSprintSelection(sprints.value[sprints.value.length - 1].id);
    }
  }

  // Measure the actual width of calendar days after mounting
  if (calendarRef.value) {
    const calendarDays = calendarRef.value.querySelectorAll(".calendar-day");
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
      const response = await fetch(
        import.meta.env.VITE_ROOT_API + `/api/sprint/${projectId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (result && result.status === "success") {
        console.log("Sprint Created:", result.data);
        // เพิ่ม sprint ใหม่ลงใน selectedProject.sprints โดยตรงเพื่อให้แสดงผลทันที
        project.value.sprints.push(result.data);
        // เรียกฟังก์ชัน viewProjectSprints เพื่อดึงข้อมูล sprint ใหม่
        await fetchProject(); // ดึงข้อมูลโปรเจกต์ใหม่เพื่ออัปเดต UI
      } else {
        console.error("Error creating sprint:", result.message);
      }
    } catch (error) {
      console.error("Error creating sprint:", error.message);
    }
  } else {
    console.error("No project selected");
  }
};

// Task helpers for team plan
const getTasksForMember = (memberId) => {
  return tasks.value
    ? tasks.value.filter(task =>
        task.assigned && task.assigned.some(assignment => assignment.memberId === memberId)
      )
    : [];
};

const isToday = (date) => {
  return isDateToday(date);
};

const getTaskPosition = (task, memberTasks) => {
  // Check for overlapping tasks
  let row = 0;
  const startDate = typeof task.startDate === "string" 
    ? parseISO(task.startDate) 
    : new Date(task.startDate);
  const endDate = typeof task.dueDate === "string" 
    ? parseISO(task.dueDate) 
    : new Date(task.dueDate);

  // Check each task for overlaps
  const overlappingRows = new Set();
  
  memberTasks.forEach(otherTask => {
    if (otherTask.id === task.id) return; // Skip the current task
    
    const otherStartDate = typeof otherTask.startDate === "string" 
      ? parseISO(otherTask.startDate) 
      : new Date(otherTask.startDate);
    const otherEndDate = typeof otherTask.dueDate === "string" 
      ? parseISO(otherTask.dueDate) 
      : new Date(otherTask.dueDate);
    
    // Check for time overlap
    if (startDate <= otherEndDate && endDate >= otherStartDate) {
      if (otherTask._calculatedRow !== undefined) {
        overlappingRows.add(otherTask._calculatedRow);
      }
    }
  });
  
  // Find an available row for the current task
  while (overlappingRows.has(row)) {
    row++;
  }
  
  // Store the calculated row in the task
  task._calculatedRow = row;
  
  return row;
};

// Modify getTaskStyle to make tasks taller and better looking
const getTaskStyle = (task, memberTasks) => {
  // Make sure task has startDate and dueDate properties
  if (!task.startDate || !task.dueDate) {
    return { display: "none" };
  }

  // Convert dates to Date objects
  const startDate =
    typeof task.startDate === "string"
      ? parseISO(task.startDate)
      : new Date(task.startDate);
  const endDate =
    typeof task.dueDate === "string" ? parseISO(task.dueDate) : new Date(task.dueDate);

  // Get the first day of the display period
  const firstDisplayDay = displayDays.value[0].date;
  const lastDisplayDay = displayDays.value[displayDays.value.length - 1].date;

  // Only show tasks that have some overlap with the displayed period
  if (endDate < firstDisplayDay || startDate > lastDisplayDay) {
    return { display: "none" };
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
  
  // Calculate vertical position (top) based on overlap level
  const row = getTaskPosition(task, memberTasks);
  const rowHeight = 18; // Increased from 14px to allow taller tasks
  const topPosition = row * rowHeight + 2; // Each row is rowHeight px apart, starting 2px from top
  
  // Fixed height for all tasks
  const height = 16; // Increased fixed task height
  
  // Create a darker border based on the task color for better definition
  const backgroundColor = task.color || getColorByStatus(task.status);
  
  // Create a slightly darker shade for the border
  const borderColor = task.color 
    ? adjustColorBrightness(task.color, -20) 
    : adjustColorBrightness(getColorByStatus(task.status), -20);

  return {
    left: `${leftPosition}px`,
    width: `${width}px`,
    top: `${topPosition}px`,
    height: `${height}px`,
    backgroundColor,
    borderLeft: `3px solid ${borderColor}`,
    boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
    zIndex: 10 - row, // Higher tasks have higher z-index
    padding: '2px 4px', // Add some padding for text
    borderRadius: '2px', // Slightly rounded corners
  };
};

// Helper function to adjust color brightness
const adjustColorBrightness = (hex, percent) => {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1,3), 16);
  let g = parseInt(hex.substring(3,5), 16);
  let b = parseInt(hex.substring(5,7), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Helper to get color by task status if no color property exists
const getColorByStatus = (status) => {
  const statusColors = {
    ToDo: "#66a3ff", // Blue for to-do
    "In Progress": "#ffcc66", // สีเหลือง for in progress
    Done: "#81c995", // Green for done,
  };

  return statusColors[status] || "#f28b82"; // Default to red if status not found
};

const getMemberInitials = (name) => {
  if (!name || name.length < 2) return name || "U";

  return (name[0] + name[name.length - 1]).toUpperCase();
};
</script>

<template>
  <div class="h-screen flex flex-col bg-[#4380BC]">
    <NavBar />
    <div v-if="isLoading" class="text-white text-center pt-20">Loading...</div>

    <div class="flex flex-1 pt-16">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-gradient-to-b from-[#3C70A3] to-[#2C5A8A] text-white p-6 shadow-lg"
      >
        <div class="flex items-center mb-6">
          <h2 class="text-xl font-bold">{{ project?.name }}</h2>
        </div>

        <div class="border-b border-white/20 pb-4 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-md font-semibold flex items-center">
              <CalendarIcon class="h-4 w-4 mr-2" /> Sprints
            </h3>
            <button
              class="text-md font-semibold rounded-full bg-white/10 hover:bg-white/20 p-1 transition-all"
              @click="addSprint"
              title="Add Sprint"
            >
              <PlusIcon class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-3 space-y-2">
            <div
              v-for="sprint in sprints"
              :key="sprint.id"
              @click="handleSprintSelection(sprint.id)"
              class="p-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-white/10"
              :class="sprint.id === selectedSprint?.id ? 'bg-[#4380BC]' : ''"
            >
              <div class="flex items-center">
                <span class="ml-2">Sprint {{ sprint.sprintNumber }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Task Board -->
      <div v-if="selectedSprint" class="flex-1 p-6 overflow-hidden">
        <div class="flex flex-row justify-between mb-4">
          <div class="flex items-center">
            <h2 class="text-2xl font-bold text-white mr-4">
              Sprint {{ selectedSprint.sprintNumber }}
            </h2>

            <!-- Sprint Status Badge -->
            <div
              class="px-3 py-1 rounded-full text-white text-sm font-medium flex items-center"
              :class="getSprintStatusColor(selectedSprint.status)"
            >
              {{ selectedSprint.status || "No Status" }}
            </div>
          </div>

          <div class="flex items-center justify-center">
            <div class="relative w-44">
              <div class="w-full h-10 bg-[#316394] rounded-full flex items-center">
                <div
                  class="absolute top-1 left-1 w-1/2 h-8 bg-white rounded-full shadow-md transition-transform duration-300"
                  :class="{ 'translate-x-20': !isBoardView }"
                ></div>
                <button
                  class="z-10 flex-1 text-center text-sm font-semibold transition-all"
                  :class="isBoardView ? 'text-[#144251]' : 'text-gray-300'"
                  @click="goBoard"
                >
                  Board
                </button>
                <button
                  class="z-10 flex-1 text-center text-sm font-semibold transition-all"
                  :class="!isBoardView ? 'text-[#144251]' : 'text-gray-300'"
                  @click="isBoardView = false"
                >
                  Team Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Plan Calendar View -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden" v-if="!isBoardView">
          <!-- Month selector -->
          <div
            class="bg-[#316394] text-white p-3 flex items-center justify-center space-x-4"
          >
            <button
              @click="prevMonth"
              class="text-xl hover:bg-blue-600 px-2 py-1 rounded"
            >
              ←
            </button>
            <span class="text-lg font-medium">{{ currentMonthDisplay }}</span>
            <button
              @click="nextMonth"
              class="text-xl hover:bg-blue-600 px-2 py-1 rounded"
            >
              →
            </button>
          </div>

          <!-- Calendar and tasks content -->
          <div class="flex overflow-x-auto" @scroll="handleScroll" ref="scrollContainer">
            <!-- Fixed column for member names -->
            <div class="sticky left-0 z-10 w-48 bg-white shadow-md">
              <div class="h-10 bg-gray-100"></div>
              <!-- Empty header cell -->
              <div
                v-for="member in teamMembers"
                :key="`fixed-${member.id}`"
                class="flex items-center p-3 h-16 border-b"
              >
                <!-- Check if the member has an image, otherwise use initials -->
                <div
                  class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2"
                >
                  <img
                    v-if="member.image"
                    :src="member.image"
                    alt="Member's Avatar"
                    class="w-full h-full rounded-full object-cover"
                    @error="member.image = null"
                  />
                  <span v-else>{{ getMemberInitials(member.username) }}</span>
                  <!-- Default to initials if no image -->
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
                  :class="{
                    'bg-blue-500 text-white': isToday(day.date),
                    'font-bold': day.date.getDate() === 1,
                  }"
                >
                  {{ day.date.getDate() }}
                </div>
              </div>

              <!-- Team Board with tasks -->
              <div>
                <div
                  v-for="member in teamMembers"
                  :key="`scroll-${member.id}`"
                  class="relative h-16 border-b"
                >
                  <!-- Background grid for days -->
                  <div class="absolute inset-0 flex">
                    <div
                      v-for="day in displayDays"
                      :key="`grid-${day.date}`"
                      class="min-w-10 w-10 h-full border-r border-gray-100"
                      :class="{
                        'border-l-2 border-l-blue-500': day.date.getDate() === 1,
                        'bg-blue-50': isToday(day.date),
                      }"
                    ></div>
                  </div>

                  <!-- Tasks for this member -->
                  <div
                    v-for="task in getTasksForMember(member.memberId)"
                    :key="task.id"
                    class="absolute text-white text-xs flex items-center rounded overflow-hidden text-ellipsis whitespace-nowrap"
                    :style="getTaskStyle(task, getTasksForMember(member.memberId))"
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
