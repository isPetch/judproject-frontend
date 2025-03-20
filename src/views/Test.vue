<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="logo">JudProject</div>
      <div class="header-nav">
        <a href="#" class="nav-link">Dashboard</a>
        <a href="#" class="nav-link active">Projects</a>
      </div>
      <div class="user-profile">
        <div class="notifications">
          <span class="notification-icon">🔔</span>
        </div>
        <div class="user">Phatcharaphon S</div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar -->
      <aside class="sidebar">
        <h2 class="project-title">Project A</h2>
        <div class="sidebar-section">
          <h3 class="section-title">Sprint</h3>
          <ul class="sprint-list">
            <li class="sprint-item active">Sprint 1</li>
            <button class="add-sprint-btn">+</button>
          </ul>
        </div>
      </aside>

      <!-- Board -->
      <main class="board-container">
        <div class="board-header">
          <h1 class="board-title">Sprint 1</h1>
          <div class="view-toggle">
            <button :class="['view-button', { active: currentView === 'board' }]" @click="currentView = 'board'">Board</button>
            <button :class="['view-button', { active: currentView === 'team' }]" @click="currentView = 'team'">Team Plan</button>
          </div>
        </div>

        <!-- Calendar section with horizontal scrolling -->
        <div class="calendar-wrapper">
          <div class="month-selector">
            <button @click="prevMonth" class="month-nav">←</button>
            <span>{{ currentMonthName }}</span>
            <button @click="nextMonth" class="month-nav">→</button>
          </div>
          
          <!-- Scrollable container for calendar and tasks -->
          <div class="scrollable-container" @scroll="handleScroll" ref="scrollContainer">
            <!-- Fixed column for member names -->
            <div class="fixed-column">
              <div class="member-column-header"></div>
              <div v-for="member in teamMembers" :key="`fixed-${member.id}`" class="member-info">
                <div class="member-avatar">
                  <div class="avatar-placeholder">{{ member.name.charAt(0) }}</div>
                </div>
                <div class="member-name">{{ member.name }}</div>
              </div>
            </div>
            
            <!-- Scrollable content -->
            <div class="scrollable-content">
              <!-- Calendar days header -->
              <div class="calendar-days" ref="calendarRef">
                <div 
                  v-for="day in displayDays" 
                  :key="day.date" 
                  class="calendar-day"
                  :class="{ 'today': isToday(day.date), 'new-month': day.date.getDate() === 1 }"
                >
                  {{ day.date.getDate() }}
                </div>
              </div>
              
              <!-- Team Board with tasks -->
              <div class="team-board">
                <div v-for="member in teamMembers" :key="`scroll-${member.id}`" class="member-row">
                  <div class="member-tasks">
                    <!-- Background grid for days -->
                    <div class="day-grid">
                      <div 
                        v-for="day in displayDays" 
                        :key="`grid-${day.date}`" 
                        class="day-cell"
                        :class="{ 'new-month': day.date.getDate() === 1 }"
                      ></div>
                    </div>
                    
                    <!-- Tasks for this member -->
                    <div 
                      v-for="task in getTasksForMember(member.id)" 
                      :key="task.id"
                      class="task-card"
                      :style="getTaskStyle(task)"
                    >
                      {{ task.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isDateToday, addMonths } from 'date-fns';

// View state
const currentView = ref('team');
const calendarRef = ref(null);
const scrollContainer = ref(null);

// Date handling
const currentDate = ref(new Date('2025-03-15')); // Starting in March 2025
const dayWidth = ref(40); // Default width before measurement

// Calculate days to display - show current month plus part of next month
const displayDays = computed(() => {
  const monthStart = startOfMonth(currentDate.value);
  const monthEnd = endOfMonth(currentDate.value);
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => ({
    date,
    dateStr: format(date, 'yyyy-MM-dd')
  }));
})

const currentMonthName = computed(() => {
  return format(currentDate.value, 'MMMM yyyy');
});

// Navigation
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

// Team members
const teamMembers = ref([
  { id: 1, name: 'Phatcharaphon Saigung' },
  { id: 2, name: 'Aunchalee Sripan' },
  { id: 3, name: 'Khemmathat Kongthong' }
]);

// Tasks
const tasks = ref([
  { id: 1, name: 'API GET A', memberId: 1, startDate: '2025-03-18', dueDate: '2025-03-20', color: '#f28b82' },
  { id: 6, name: 'Jaaaaaa', memberId: 2, startDate: '2025-03-26', dueDate: '2025-04-02', color: '#f28b82' },
  { id: 2, name: 'API POST A', memberId: 1, startDate: '2025-03-22', dueDate: '2025-03-25', color: '#ff66ff' },
  { id: 3, name: 'API POST B', memberId: 2, startDate: '2025-03-19', dueDate: '2025-03-21', color: '#81c995' },
  { id: 4, name: 'API GET B', memberId: 3, startDate: '2025-03-23', dueDate: '2025-03-26', color: '#ffcc66' },
  { id: 5, name: 'API POST C', memberId: 3, startDate: '2025-03-24', dueDate: '2025-03-27', color: '#66a3ff' }
]);

// Task helpers
const getTasksForMember = (memberId) => {
  return tasks.value.filter(task => task.memberId === memberId);
};

const isToday = (date) => {
  return isDateToday(date);
};

const getTaskStyle = (task) => {
  // Convert dates to Date objects
  const startDate = parseISO(task.startDate);
  const endDate = parseISO(task.dueDate);
  
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
  
  return {
    left: `${leftPosition}px`,
    width: `${width}px`,
    backgroundColor: task.color
  };
};

// Measure the actual width of calendar days after mounting
onMounted(() => {
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
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #2c5282;
  color: white;
  height: 50px;
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: 2rem;
}

.header-nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
}

.nav-link.active {
  border-bottom: 2px solid white;
}

.user-profile {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 1rem;
}

/* Main Content */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 200px;
  background-color: #2c5282;
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.project-title {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.sprint-list {
  list-style: none;
}

.sprint-item {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.sprint-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

.add-sprint-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-top: 0.5rem;
}

/* Board Container */
.board-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #3b82f6;
  color: white;
  padding: 1rem;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-toggle {
  display: flex;
  background-color: #2c5282;
  border-radius: 20px;
  overflow: hidden;
}

.view-button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: white;
  cursor: pointer;
}

.view-button.active {
  background-color: white;
  color: #2c5282;
}

/* Calendar */
.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.month-nav {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
}

/* Scrollable container structure */
.scrollable-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.fixed-column {
  position: sticky;
  left: 0;
  z-index: 10;
  width: 200px;
  background-color: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.member-column-header {
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-top-left-radius: 8px;
}

.scrollable-content {
  flex: 1;
  overflow-x: auto;
  min-width: 0;
}

.calendar-days {
  display: flex;
  background-color: rgba(255, 255, 255, 0.1);
  border-top-right-radius: 8px;
  padding: 0.5rem;
  min-height: 40px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.calendar-day {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-right: 2px;
}

.calendar-day.new-month {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}

.calendar-day.today {
  background-color: white;
  color: #3b82f6;
  font-weight: bold;
}

/* Team Board */
.team-board {
  background-color: white;
  border-bottom-right-radius: 8px;
}

.member-row {
  display: flex;
  min-height: 60px;
}

.member-info {
  width: 200px;
  display: flex;
  align-items: center;
  padding: 1rem;
  min-height: 60px;
  background-color: white;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e2e8f0;
  margin-right: 0.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  color: #2c5282;
  font-weight: bold;
}

.member-name {
  color: #1a202c;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-tasks {
  position: relative;
  min-height: 60px;
  min-width: 100%;
}

.day-grid {
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.day-cell {
  min-width: 40px;
  height: 100%;
  border-right: 1px solid #f0f2f5;
}

.day-cell.new-month {
  border-left: 2px solid #3b82f6;
}

.task-card {
  position: absolute;
  top: 10px;
  height: 40px;
  padding: 0.25rem 0.5rem;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  z-index: 1;
  overflow: hidden;
  white-space: nowrap;
}
</style>