<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import ModalTask from "@/components/ModalTask.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";
import RiMore2Fill from "../components/icon/RiMore2Fill.vue";
import MaterialSymbolsCloseRounded from "../components/icon/MaterialSymbolsCloseRounded.vue";
import { PlusIcon, CalendarIcon, ChevronDownIcon, ArrowRightIcon, CheckCircleIcon, TrashIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const selectedTask = ref(null);
const isModalVisible = ref(false);
const newTaskName = ref("");
const isBoardView = ref(true);
const isAddingTask = ref({
  ToDo: false,
  "In Progress": false,
  Done: false,
});
const addingStatus = ref("");
const newStepName = ref("");
const addingStepTaskId = ref(null);
const isLoading = ref(false);
const dropdownSubtaskId = ref(null);
const editingSubtaskId = ref(null);
const sprintDropdownOpen = ref(false);
const taskDropdownOpen = ref(null);
const draggedTask = ref(null);

// UI improvement - Task statistics
const taskStats = computed(() => {
  if (!tasks.value) return { total: 0, completed: 0, percentage: 0 };
  
  const total = tasks.value.length;
  const completed = tasks.value.filter(t => t.status === 'Done').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, percentage };
});
// Add drag and drop methods
const onDragStart = (task) => {
  draggedTask.value = task;
};

const onDragOver = (event) => {
  event.preventDefault();
};

const onDrop = async (targetStatus) => {
  if (!draggedTask.value) return;

  // Prevent dropping task in the same column
  if (draggedTask.value.status === targetStatus) return;

  try {
    await updateTaskStatus(draggedTask.value, targetStatus);
    draggedTask.value = null;
  } catch (error) {
    console.error("Error moving task:", error);
  }
};

// Better columns layout with fixed titles
const columns = [
  { id: 'ToDo', title: 'TO DO', icon: 'clipboard', color: '#E5F0FB', headerColor: '#3C70A3' },
  { id: 'In Progress', title: 'IN PROGRESS', icon: 'arrow-right', color: '#FFF8E5', headerColor: '#F59E0B' },
  { id: 'Done', title: 'DONE', icon: 'check-circle', color: '#EDFCF4', headerColor: '#10B981' }
];

// Function to navigate to Team Plan
const goTeamPlan = () => {
  router.push(`/project/teamplan/${route.params.id}`);
};

const addTask = async (sprintId) => {
  if (!newTaskName.value.trim()) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/task/${sprintId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      body: JSON.stringify({ name: newTaskName.value, status: addingStatus.value, priority: "Medium" })
    });

    const result = await response.json();
    if (result.status === "success") {
      await fetchSprint(sprintId);
      newTaskName.value = "";
      isAddingTask.value[addingStatus.value] = false;
    } else {
      console.error("Error creating task:", result.message);
    }
  } catch (error) {
    console.error("Error creating task:", error.message);
  }
};

// delete a task
const deleteTask = async (taskId) => {
  const confirmDelete = confirm("Are you sure you want to delete this task?");
  if (confirmDelete) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/task/${taskId}/delete`, {
        method: "DELETE",
        headers: { "Authorization": `${token}` }
      });
      
      if (response.ok) {
        await fetchSprint(selectedSprint.value.id);
        // Close task dropdown if open
        taskDropdownOpen.value = null;
        localStorage.removeItem(`task_comments_${props.task.id}`);
      } else {
        console.error("Error deleting task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }
};

// Toggle task menu dropdown
const toggleTaskDropdown = (id) => {
  taskDropdownOpen.value = taskDropdownOpen.value === id ? null : id;
  // Close any open subtask dropdown
  dropdownSubtaskId.value = null;
};

const openTaskInput = (status) => {
  Object.keys(isAddingTask.value).forEach(key => {
    isAddingTask.value[key] = false;
  });
  isAddingTask.value[status] = true;
  addingStatus.value = status;
};

const addStep = async (taskId) => {
  if (!newStepName.value.trim()) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      body: JSON.stringify({ name: newStepName.value, status: "ToDo" })
    });

    const result = await response.json();
    if (result.status === "success") {
      await fetchSprint(selectedSprint.value.id);
      newStepName.value = "";
      addingStepTaskId.value = null;
    } else {
      console.error("Error creating step:", result.message);
    }
  } catch (error) {
    console.error("Error creating step:", error.message);
  }
};

const openStepInput = (taskId) => {
  addingStepTaskId.value = taskId;
};

// Load project and Sprint List
const fetchProject = async () => {
  isLoading.value = true;
  try {
    project.value = await getProjectById(projectId);
    sprints.value = project.value.sprints || [];

    if (sprints.value.length > 0) {
      const savedSprintId = localStorage.getItem(`selectedSprintId_${projectId}`);
      if (savedSprintId) {
        handleSprintSelection(savedSprintId);
      } else {
        handleSprintSelection(sprints.value[sprints.value.length - 1].id);
      }
    }
  } catch (error) {
    console.error("Error fetching project:", error);
  } finally {
    isLoading.value = false;
  }
};

// Load Sprint and Tasks
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

// Update Task Board when selecting a new Sprint
const handleSprintSelection = (sprintId) => {
  fetchSprint(sprintId);
  localStorage.setItem(`selectedSprintId_${projectId}`, sprintId);
  sprintDropdownOpen.value = false;
};

const openTaskDetails = (task) => {
  selectedTask.value = task;
  isModalVisible.value = true;
  const filteredTasks = tasks.value.filter(t => t.id !== task.id);
  selectedSprint.value.filteredTasks = filteredTasks;
};

const closeModal = () => {
  isModalVisible.value = false;
  selectedTask.value = null;
};

const addSprint = async () => {
  if (projectId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/sprint/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
      });
      const result = await response.json();

      if (result && result.status === 'success') {
        console.log('Sprint Created:', result.data);
        project.value.sprints.push(result.data);
        await fetchProject();
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

const toggleSubtaskStatus = async (task, subtask) => {
  const newStatus = subtask.status === 'Done' ? 'ToDo' : 'Done';
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      subtask.status = newStatus;
    } else {
      console.error("Error updating subtask status");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Open/close dropdown
const toggleDropdown = (id) => {
  dropdownSubtaskId.value = dropdownSubtaskId.value === id ? null : id;
  // Close any open task dropdown
  taskDropdownOpen.value = null;
};

// Edit subtask
const editSubtask = (subtask) => {
  editingSubtaskId.value = subtask.id;
  dropdownSubtaskId.value = null;
};

// Save after editing
const saveSubtask = async (subtask) => {
  try {
    const token = localStorage.getItem("token");
    await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      body: JSON.stringify({ name: subtask.name })
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
  } finally {
    editingSubtaskId.value = null;
  }
};

// Delete step
const deleteStep = async (subtaskId) => {
  const confirmDelete = confirm("Are you sure you want to delete this step?");
  if (confirmDelete) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtaskId}/delete`, {
        method: "DELETE",
        headers: { "Authorization": `${token}` }
      });
      if (response.ok) {
        await fetchSprint(selectedSprint.value.id);
      } else {
        console.error("Error deleting step");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

// Update task status
const updateTaskStatus = async (task, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/task/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `${token}` },
      body: JSON.stringify({
        status: newStatus,
        description: task.description,
        sprintId: selectedSprint.value.id,
        priority: task.priority,
        prerequisite: task.prerequisite ? task.prerequisite.id : null
      })
    });
    location.reload();
    if (response.ok) {
      await fetchSprint(selectedSprint.value.id);
    } else {
      console.error("Error updating task status");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Get priority color class
const getPriorityColorClass = (priority) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

onMounted(() => {
  fetchProject();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-gradient-to-b from-[#4380BC] to-[#316394]">
    <NavBar />
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg flex items-center">
        <svg class="animate-spin h-5 w-5 mr-3 text-[#4380BC]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading...</span>
      </div>
    </div>
    
    <div class="flex flex-1 pt-16">
      <!-- Sidebar -->
      <aside class="w-64 bg-gradient-to-b from-[#3C70A3] to-[#2C5A8A] text-white p-6 shadow-lg">
        <div class="flex items-center mb-6">
          <h2 class="text-xl font-bold">{{ project?.name }}</h2>
        </div>
        
        <div class="border-b border-white/20 pb-4 mb-4">
          <div class="flex items-center justify-between">
            <h3 class="text-md font-semibold flex items-center">
              <CalendarIcon class="h-4 w-4 mr-2" /> Sprints
            </h3>
            <button class="text-md font-semibold rounded-full bg-white/10 hover:bg-white/20 p-1 transition-all" @click="addSprint" title="Add Sprint">
              <PlusIcon class="h-4 w-4" />
            </button>
          </div>
          
          <div class="mt-3 space-y-2">
            <div v-for="sprint in sprints" :key="sprint.id" 
                 @click="handleSprintSelection(sprint.id)"
                 class="p-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-white/10"
                 :class="sprint.id === selectedSprint?.id ? 'bg-[#4380BC]' : ''">
              <div class="flex items-center">
                <span class="ml-2">Sprint {{ sprint.sprintNumber }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Task statistics -->
        <div class="mb-6">
          <h3 class="text-md font-semibold mb-3">Task Progress</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Completed</span>
              <span>{{ taskStats.completed }}/{{ taskStats.total }}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2.5">
              <div class="bg-green-400 h-2.5 rounded-full" :style="`width: ${taskStats.percentage}%`"></div>
            </div>
            <div class="text-right text-sm">
              {{ taskStats.percentage }}% complete
            </div>
          </div>
        </div>
      </aside>

      <!-- Task Board -->
      <div v-if="selectedSprint" class="flex-1 p-6 overflow-hidden">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center">
            <h2 class="text-2xl font-bold text-white mr-4">
              Sprint {{ selectedSprint.sprintNumber }}
            </h2>
            
            <!-- Sprint selector dropdown -->
            <div class="relative">
              <button 
                @click="sprintDropdownOpen = !sprintDropdownOpen"
                class="flex items-center space-x-1 text-white bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition"
              >
                <span>Change Sprint</span>
                <ChevronDownIcon class="h-4 w-4" />
              </button>
              
              <div v-if="sprintDropdownOpen" 
                   class="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 w-48 py-1 text-gray-800">
                <div v-for="sprint in sprints" :key="sprint.id"
                     @click="handleSprintSelection(sprint.id)"
                     class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  Sprint {{ sprint.sprintNumber }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- View toggle -->
          <div class="bg-[#316394] rounded-full p-1 shadow-md">
            <div class="relative flex">
              <div class="absolute w-1/2 h-full bg-white rounded-full transition-all duration-300"
                  :class="isBoardView ? 'left-0' : 'left-1/2'"></div>
              <button
                @click="isBoardView = true"
                class="relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300"
                :class="isBoardView ? 'text-[#144251]' : 'text-white'"
              >
                Board
              </button>
              <button
                @click="goTeamPlan"
                class="relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300"
                :class="!isBoardView ? 'text-[#144251]' : 'text-white'"
              >
                Team Plan
              </button>
            </div>
          </div>
        </div>

        <!-- Task columns -->
        <div class="grid grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          <div v-for="column in columns" :key="column.id" 
              class="flex flex-col rounded-xl shadow-lg overflow-hidden border border-white/10"
              @dragover.prevent="onDragOver"
              @drop="() => onDrop(column.id)">
            <!-- Column header -->
            <div class="p-4" :style="`background-color: ${column.headerColor}`">
              <h3 class="text-lg font-bold text-white flex items-center">
                <span v-if="column.id === 'ToDo'">📋</span>
                <span v-else-if="column.id === 'In Progress'">🔄</span>
                <span v-else>✅</span>
                {{ column.title }}
                <span class="ml-2 bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                  {{ tasks.filter(t => t.status === column.id).length }}
                </span>
              </h3>
            </div>
            
            <!-- Tasks container -->
            <div class="flex-1 p-4 overflow-y-auto" :style="`background-color: ${column.color}`">
              <!-- Task cards -->
              <div v-if="tasks.filter(t => t.status === column.id).length > 0" class="space-y-3">
                <div v-for="task in tasks.filter(t => t.status === column.id)" :key="task.id"
                    draggable="true"
                    @dragstart="() => onDragStart(task)"
                    class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-visible cursor-move">
                  <!-- Task header -->
                  <div class="p-3 cursor-pointer border-b border-gray-100">
                    <div class="flex justify-between items-start">
                      <h4 @click="openTaskDetails(task)" class="text-gray-800 font-semibold text-lg">{{ task.name }}</h4>
                      <div class="flex items-center space-x-2">
                        <span :class="[getPriorityColorClass(task.priority), 'text-xs px-2 py-1 rounded-full']">
                          {{ task.priority }}
                        </span>
                        <!-- Task menu button -->
                        <div class="relative">
                          <button @click.stop="toggleTaskDropdown(task.id)" class="text-gray-400 hover:text-gray-600">
                            <RiMore2Fill class="h-4 w-4" />
                          </button>
                          
                          <!-- Task dropdown menu -->
                          <div v-if="taskDropdownOpen === task.id" 
                               class="absolute right-0 top-full mt-1 bg-white border rounded shadow-md z-30 w-36">
                            <button @click.stop="deleteTask(task.id)" 
                                    class="flex items-center w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100">
                              <TrashIcon class="h-4 w-4 mr-1" /> Delete Task
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Task actions -->
                    <div class="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <div @click="openTaskDetails(task)" class="flex items-center">
                        <span>{{ task.steps?.length || 0 }} steps</span>
                        <span class="mx-2">•</span>
                        <span>{{ task.steps?.filter(s => s.status === 'Done').length || 0 }} completed</span>
                      </div>
                      
                      <div class="flex space-x-2">
                        <!-- Move to next column button if not in "Done" column -->
                        <button v-if="column.id !== 'Done'" 
                                @click.stop="updateTaskStatus(task, column.id === 'ToDo' ? 'In Progress' : 'Done')"
                                class="text-blue-500 hover:text-blue-700"
                                :title="`Move to ${column.id === 'ToDo' ? 'In Progress' : 'Done'}`">
                          <ArrowRightIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Steps section -->
                  <div class="bg-gray-50 p-2">
                    <!-- Steps list -->
                    <div v-if="task.steps && task.steps.length > 0" class="space-y-1">
                      <div v-for="subtask in task.steps" :key="subtask.id" 
                           class="flex items-center p-2 hover:bg-gray-100 rounded">
                        <input 
                          type="checkbox" 
                          :checked="subtask.status === 'Done'" 
                          @change="toggleSubtaskStatus(task, subtask)"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        
                        <div class="flex-1 ml-3 flex justify-between items-center">
                          <!-- Editing subtask name -->
                          <input
                            v-if="editingSubtaskId === subtask.id"
                            v-model="subtask.name"
                            @blur="saveSubtask(subtask)"
                            @keyup.enter="saveSubtask(subtask)"
                            class="border border-gray-300 px-2 py-1 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          
                          <!-- Normal step display -->
                          <span v-else :class="{'line-through text-gray-400': subtask.status === 'Done'}" class="text-sm">
                            {{ subtask.name }}
                          </span>
                          
                          <!-- Step actions -->
                          <div class="relative">
                            <button @click.stop="toggleDropdown(subtask.id)" class="text-gray-400 hover:text-gray-600">
                              <RiMore2Fill class="h-4 w-4" />
                            </button>
                            
                            <!-- Dropdown menu -->
                            <div v-if="dropdownSubtaskId === subtask.id" 
                                 class="absolute right-0 top-full mt-1 bg-white border rounded shadow-md z-20 w-36">
                              <button @click.stop="editSubtask(subtask)" 
                                      class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100">
                                Edit
                              </button>
                              <button @click.stop="deleteStep(subtask.id)" 
                                      class="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Add new step form -->
                    <div v-if="addingStepTaskId === task.id" class="mt-2 p-2 bg-white rounded border border-gray-200">
                      <input 
                        v-model="newStepName" 
                        class="w-full p-2 border rounded text-sm focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Enter step name"
                        @keyup.enter="addStep(task.id)"
                      />
                      <div class="flex justify-between mt-2">
                        <button @click="addStep(task.id)" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                          Add Step
                        </button>
                        <button @click="addingStepTaskId = null" class="text-gray-500 hover:text-gray-700">
                          <MaterialSymbolsCloseRounded class="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <!-- "Add step" button -->
                    <button v-else @click.stop="openStepInput(task.id)" 
                            class="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center">
                      <PlusIcon class="h-3 w-3 mr-1" /> Add Step
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Empty state -->
              <div v-else class="text-center p-4 text-gray-500">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <p>No tasks in this column</p>
                </div>
              </div>
              
              <!-- Add new task form -->
              <div v-if="isAddingTask[column.id]" class="mt-4 bg-white p-3 rounded-lg shadow">
                <input 
                  v-model="newTaskName" 
                  class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Enter task name"
                  @keyup.enter="addTask(selectedSprint.id)"
                />
                <div class="flex justify-between mt-2">
                  <button @click="addTask(selectedSprint.id)" 
                          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    Add Task
                  </button>
                  <button @click="isAddingTask[column.id] = false" class="text-gray-500">
                    <MaterialSymbolsCloseRounded class="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <!-- "Add task" button -->
              <button v-else @click="openTaskInput(column.id)" 
                      class="mt-4 w-full flex items-center justify-center p-2 bg-white/70 hover:bg-white rounded-lg border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 transition-colors">
                <PlusIcon class="h-4 w-4 mr-1" /> Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Task Detail Modal -->
    <ModalTask
      v-if="isModalVisible"
      :task="selectedTask"
      :tasks="selectedSprint?.filteredTasks"
      :sprints="sprints"
      :isVisible="isModalVisible"
      :sprintId="selectedSprint?.id"
      :projectId="projectId"
      :closeModal="closeModal"
    />
  </div>
</template>

<style scoped>
.task-enter-active, .task-leave-active {
  transition: all 0.3s ease;
}
.task-enter-from, .task-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>