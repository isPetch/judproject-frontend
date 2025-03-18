<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import ModalTask from "@/components/ModalTask.vue";
import { getProjectById, getSprintById } from "../composable/getJudProjects";
import RiMore2Fill from "../components/icon/RiMore2Fill.vue"
import MaterialSymbolsCloseRounded from "../components/icon/MaterialSymbolsCloseRounded.vue"

const route = useRoute();
const projectId = route.params.id;
const project = ref(null);
const sprints = ref([]);
const selectedSprint = ref(null);
const tasks = ref([]);
const selectedTask = ref(null);  // Store the selected task for the modal
const isModalVisible = ref(false);  // Control visibility of the modal
const newTaskName = ref("");
const isBoardView = ref(true);
const isAddingTask = ref({
  ToDo: false,
  "In Progress": false,
  Done: false,
});
const addingStatus = ref(""); // เก็บสถานะของคอลัมน์ที่กด + New Task
const newStepName = ref(""); 
const addingStepTaskId = ref(null); 

const addTask = async (sprintId) => {
  if (!newTaskName.value.trim()) return;

  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/task/${sprintId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTaskName.value, status: addingStatus.value, priority: "Medium" })
    });

    const result = await response.json();
    if (result.status === "success") {
      await fetchSprint(sprintId);  // ดึงข้อมูลใหม่จาก API แทนที่จะใช้ push
      newTaskName.value = ""; 
      isAddingTask.value[addingStatus.value] = false; 
    } else {
      console.error("Error creating task:", result.message);
    }
  } catch (error) {
    console.error("Error creating task:", error.message);
  }
};


const openTaskInput = (status) => {
  // รีเซ็ตค่า isAddingTask ทุกช่องให้เป็น false ก่อน
  Object.keys(isAddingTask.value).forEach(key => {
    isAddingTask.value[key] = false;
  });

  // เปิดช่อง input เฉพาะช่องที่ถูกกด
  isAddingTask.value[status] = true;
  addingStatus.value = status;
};
const addStep = async (taskId) => {
  if (!newStepName.value.trim()) return;

  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStepName.value, status: "ToDo" })
    });

    const result = await response.json();
    if (result.status === "success") {
      await fetchSprint(selectedSprint.value.id); // โหลด Sprint ใหม่เพื่ออัปเดต UI
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
const toggleSubtaskStatus = async (task, subtask) => {
  const newStatus = subtask.status === 'Done' ? 'ToDo' : 'Done'; // สลับค่า Done <-> ToDo
  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      subtask.status = newStatus; // อัปเดตค่าใน UI
    } else {
      console.error("Error updating subtask status");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const dropdownSubtaskId = ref(null);  // ใช้เก็บ ID ของ step ที่เปิด dropdown อยู่
const editingSubtaskId = ref(null);  // ใช้เก็บ ID ของ step ที่กำลังแก้ไข

// เปิด/ปิด dropdown
const toggleDropdown = (id) => {
  dropdownSubtaskId.value = dropdownSubtaskId.value === id ? null : id;
};

// กด "Edit" → เปลี่ยนเป็น input
const editSubtask = (subtask) => {
  editingSubtaskId.value = subtask.id;
  dropdownSubtaskId.value = null; // ปิด dropdown
};

// บันทึกเมื่อแก้ไขเสร็จ
const saveSubtask = async (subtask) => {
  try {
    await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subtask.name })
    });
  } catch (error) {
    console.error("Error updating subtask:", error);
  } finally {
    editingSubtaskId.value = null; // ปิด input หลังจากบันทึก
  }
};

// ลบ step
const deleteStep = async (subtaskId) => {
  const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Step นี้?");
  if (confirmDelete) {
    try {
      const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${subtaskId}/delete`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchSprint(selectedSprint.value.id); // โหลดข้อมูลใหม่
      } else {
        console.error("Error deleting step");
      }
    } catch (error) {
      console.error("Error:", error);
    }
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
                  @click="isBoardView = true"
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

        <div class="grid grid-cols-3 gap-6">
          <div class="bg-white p-4 rounded-xl shadow">
            <h3 class="text-lg font-semibold mb-3 text-[#144251]">TO DO</h3>
            <div class="max-h-[calc(100vh-250px)] overflow-y-auto">
              <div v-if="tasks.some(t => t.status === 'ToDo')" class="flex flex-col">
                <div
                  v-for="task in tasks.filter(t => t.status === 'ToDo')"
                  :key="task.id"
                  class="flex flex-col bg-[#EAEBF1] p-3 rounded-lg mb-2 shadow-sm hover:bg-gray-300 transition-all">
                  <div @click="openTaskDetails(task)" class="flex flex-row cursor-pointer justify-between">
                    <div class="text-lg font-semibold ">{{ task.name }}</div>
                    <div>priority</div>
                  </div>
                   <!-- step -->
                   <div v-if="task.steps && task.steps.length">
                      <div v-for="subtask in task.steps" :key="subtask.id" class="subtask-item flex items-center space-x-1 space-y-1 p-1 border-b border-gray-300">
                          <input 
                            type="checkbox"  class="checkbox checkbox-xs border-black bg-white checked:bg-white"
                            :checked="subtask.status === 'Done'" 
                            @change="toggleSubtaskStatus(task, subtask)"
                          />
                          <div class="flex flex-row w-full justify-between items-center">
                          <!-- Input แก้ไขชื่อ Step -->
                          <input
                            v-if="editingSubtaskId === subtask.id"
                            v-model="subtask.name"
                            @blur="saveSubtask(subtask)"
                            @keyup.enter="saveSubtask(subtask)"
                            class="border px-2 py-1 rounded w-full"
                          />

                          <!-- ชื่อ Step ปกติ -->
                          <span v-else class="cursor-pointer" @click="editSubtask(subtask)">
                            {{ subtask.name }}
                          </span>
                          <div class="flex items-center space-x-2">
                          <!-- ปุ่ม More -->
                          <div class="relative">
                            <RiMore2Fill class="cursor-pointer" @click="toggleDropdown(subtask.id)" />
                            
                            <!-- Dropdown -->
                            <div v-if="dropdownSubtaskId === subtask.id" class="absolute right-0 bg-white border rounded shadow-md z-10 w-32">
                              <button @click="editSubtask(subtask)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left">Edit</button>
                              <button @click="deleteStep(subtask.id)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left text-red-500">Delete</button>
                            </div>
                          </div>

                          </div>
                          </div>
                      </div>
                    </div>
                    <!-- ปุ่ม + New Step -->
                    <div v-if="addingStepTaskId === task.id">
                      <input v-model="newStepName" class="w-full p-2 border rounded" placeholder="Enter step name" />
                      <div class="flex mt-2">
                        <button @click="addStep(task.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add Step</button>
                        <button @click="addingStepTaskId = null" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                      </div>
                    </div>
                    <div v-else class="text-[#3C70A3] cursor-pointer" @click="openStepInput(task.id)">+ New Step</div>
                  
                </div>
              </div>
              <!-- Add task -->
              <div v-if="isAddingTask['ToDo']">
                <input 
                  v-model="newTaskName" 
                  class="w-full p-2 border rounded" 
                  placeholder="Enter task name"
                />
                <div class="flex mt-2">
                  <button @click="addTask(selectedSprint.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add task</button>
                  <button @click="isAddingTask['ToDo'] = false" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                </div>
              </div>
              <div class="cursor-pointer pl-4 text-[#BAB1B1]" @click="openTaskInput('ToDo')">+ New Task</div>
            </div>

          </div>

          <div class="bg-white p-4 rounded-xl shadow">
            <h3 class="text-lg font-semibold mb-3 text-[#144251]">IN PROGRESS</h3>
            <div class="max-h-[calc(100vh-250px)] overflow-y-auto">
              <div v-if="tasks.some(t => t.status === 'In Progress')" class="flex flex-col">
                <div
                  v-for="task in tasks.filter(t => t.status === 'In Progress')"
                  :key="task.id"
                  class="flex flex-col bg-[#EAEBF1] p-3 rounded-lg mb-2 shadow-sm hover:bg-gray-300 transition-all">
                  <div @click="openTaskDetails(task)" class="flex flex-row cursor-pointer justify-between">
                    <div class="text-lg font-semibold ">{{ task.name }}</div>
                    <div>priority</div>
                  </div>
                   <!-- step -->
                   <div v-if="task.steps && task.steps.length">
                      <div v-for="subtask in task.steps" :key="subtask.id" class="subtask-item flex items-center space-x-1 space-y-1 p-1 border-b border-gray-300">
                          <input 
                            type="checkbox"  class="checkbox checkbox-xs border-black bg-white checked:bg-white"
                            :checked="subtask.status === 'Done'" 
                            @change="toggleSubtaskStatus(task, subtask)"
                          />
                          <div class="flex flex-row w-full justify-between items-center">
                          <!-- Input แก้ไขชื่อ Step -->
                          <input
                            v-if="editingSubtaskId === subtask.id"
                            v-model="subtask.name"
                            @blur="saveSubtask(subtask)"
                            @keyup.enter="saveSubtask(subtask)"
                            class="border px-2 py-1 rounded w-full"
                          />

                          <!-- ชื่อ Step ปกติ -->
                          <span v-else class="cursor-pointer" @click="editSubtask(subtask)">
                            {{ subtask.name }}
                          </span>
                          <div class="flex items-center space-x-2">
                          <!-- ปุ่ม More -->
                          <div class="relative">
                            <RiMore2Fill class="cursor-pointer" @click="toggleDropdown(subtask.id)" />
                            
                            <!-- Dropdown -->
                            <div v-if="dropdownSubtaskId === subtask.id" class="absolute right-0 bg-white border rounded shadow-md z-10 w-32">
                              <button @click="editSubtask(subtask)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left">Edit</button>
                              <button @click="deleteStep(subtask.id)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left text-red-500">Delete</button>
                            </div>
                          </div>

                          </div>
                          </div>
                      </div>
                    </div>
                    <!-- ปุ่ม + New Step -->
                    <div v-if="addingStepTaskId === task.id">
                      <input v-model="newStepName" class="w-full p-2 border rounded" placeholder="Enter step name" />
                      <div class="flex mt-2">
                        <button @click="addStep(task.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add Step</button>
                        <button @click="addingStepTaskId = null" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                      </div>
                    </div>
                    <div v-else class="text-[#3C70A3] cursor-pointer" @click="openStepInput(task.id)">+ New Step</div>
                  
                </div>
              </div>
              <!-- Add task -->
              <div v-if="isAddingTask['In Progress']">
                <input 
                  v-model="newTaskName" 
                  class="w-full p-2 border rounded" 
                  placeholder="Enter task name"
                />
                <div class="flex mt-2">
                  <button @click="addTask(selectedSprint.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add task</button>
                  <button @click="isAddingTask['In Progress'] = false" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                </div>
              </div>
              <div class="cursor-pointer pl-4 text-[#BAB1B1]" @click="openTaskInput('In Progress')">+ New Task</div>
            </div>

          </div>

          <div class="bg-white p-4 rounded-xl shadow">
            <h3 class="text-lg font-semibold mb-3 text-[#144251]">DONE</h3>
            <div class="max-h-[calc(100vh-250px)] overflow-y-auto">
              <div v-if="tasks.some(t => t.status === 'Done')" class="flex flex-col ">
                <div
                  v-for="task in tasks.filter(t => t.status === 'Done')"
                  :key="task.id"
                  class="flex flex-col bg-[#EAEBF1] p-3 rounded-lg mb-2 shadow-sm hover:bg-gray-300 transition-all">
                  <div @click="openTaskDetails(task)" class="flex flex-row cursor-pointer justify-between">
                    <div class="text-lg font-semibold ">{{ task.name }}</div>
                    <div>priority</div>
                  </div>
                   <!-- step -->
                   <div v-if="task.steps && task.steps.length">
                    <div v-for="subtask in task.steps" :key="subtask.id" class="subtask-item flex items-center space-x-1 space-y-1 p-1 border-b border-gray-300">
                          <input 
                            type="checkbox"  class="checkbox checkbox-xs border-black bg-white checked:bg-white"
                            :checked="subtask.status === 'Done'" 
                            @change="toggleSubtaskStatus(task, subtask)"
                          />
                          <div class="flex flex-row w-full justify-between items-center">
                          <!-- Input แก้ไขชื่อ Step -->
                          <input
                            v-if="editingSubtaskId === subtask.id"
                            v-model="subtask.name"
                            @blur="saveSubtask(subtask)"
                            @keyup.enter="saveSubtask(subtask)"
                            class="border px-2 py-1 rounded w-full"
                          />

                          <!-- ชื่อ Step ปกติ -->
                          <span v-else class="cursor-pointer" @click="editSubtask(subtask)">
                            {{ subtask.name }}
                          </span>
                          <div class="flex items-center space-x-2">
                          <!-- ปุ่ม More -->
                          <div class="relative">
                            <RiMore2Fill class="cursor-pointer" @click="toggleDropdown(subtask.id)" />
                            
                            <!-- Dropdown -->
                            <div v-if="dropdownSubtaskId === subtask.id" class="absolute right-0 bg-white border rounded shadow-md z-10 w-32">
                              <button @click="editSubtask(subtask)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left">Edit</button>
                              <button @click="deleteStep(subtask.id)" class="block w-full px-3 py-1 hover:bg-gray-200 text-left text-red-500">Delete</button>
                            </div>
                          </div>

                          </div>
                          </div>
                      </div>
                    </div>
                    <!-- ปุ่ม + New Step -->
                    <div v-if="addingStepTaskId === task.id">
                      <input v-model="newStepName" class="w-full p-2 border rounded" placeholder="Enter step name" />
                      <div class="flex mt-2">
                        <button @click="addStep(task.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add Step</button>
                        <button @click="addingStepTaskId = null" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                      </div>
                    </div>
                    <div v-else class="text-[#3C70A3] cursor-pointer" @click="openStepInput(task.id)">+ New Step</div>
                  
                </div>
              </div>
              <!-- Add task -->
              <div v-if="isAddingTask['Done']">
                <input 
                  v-model="newTaskName" 
                  class="w-full p-2 border rounded" 
                  placeholder="Enter task name"
                />
                <div class="flex mt-2">
                  <button @click="addTask(selectedSprint.id)" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Add task</button>
                  <button @click="isAddingTask['Done'] = false" class="ml-2 text-black"><MaterialSymbolsCloseRounded/></button>
                </div>
              </div>
              <div class="cursor-pointer pl-4 text-[#BAB1B1]" @click="openTaskInput('Done')">+ New Task</div>
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
      :sprintId="selectedSprint?.id"
      :closeModal="closeModal"
    />
  </div>
</template>
<style scoped>
.w-18 {
  width: 4.5rem; /* กำหนดขนาดของปุ่ม Toggle */
}
</style>
