<script setup>
import { ref, computed, onMounted  } from "vue";

const props = defineProps({
  task: Object,
  tasks: Array,
  sprints: Array,
  isVisible: Boolean,
  closeModal: Function,
  projectId: Number,
  sprintId: String,
});
const isEditingName = ref(false);
const editedTaskName = ref(props.task.name);
const editedStatus = ref(props.task.status);
const editedPriority = ref(props.task.priority);
const editedDescription = ref(props.task.description);
const editedPrerequisite = ref(props.task.prerequisite ? props.task.prerequisite.id : null);
const editedSprintId = ref(props.task.sprintId);
const sprintData = ref({ projectId: props.projectId });
const showMemberModal = ref(false);  // Modal visibility
const selectedMember = ref(null);    // Selected member
const availableMembers = ref([]);

onMounted(() => {
  // ดึงข้อมูลสมาชิกจาก API ตาม projectId ที่ได้มาจาก sprintData
  fetch(import.meta.env.VITE_ROOT_API + `/api/project/${sprintData.value.projectId}/members`)
    .then(response => response.json())
    .then(data => {
      availableMembers.value = data.members;
      console.log(availableMembers.value)
    })
    .catch(error => console.error("Error fetching members:", error));
});

const openMemberModal = () => {
  showMemberModal.value = true;
};

const closeMemberModal = () => {
  showMemberModal.value = false;
};

const addMemberToTask = () => {
  if (selectedMember.value) {
    const member = availableMembers.value.find(m => m.id === selectedMember.value);
    if (member) {
      // เพิ่มสมาชิกที่เลือกเข้าไปใน task
      props.task.assigned.push(member);
      closeMemberModal();
    }
  }
};

const startEditing = (field) => {
  if (field === "name") {
    isEditingName.value = true;
    editedTaskName.value = props.task.name;
  } else if (field === "status") {
    editedStatus.value = props.task.status;
  } else if (field === "priority") {
    editedPriority.value = props.task.priority;
  }  else if (field === "description") {
    editedDescription.value = props.task.description;
  }
};

const saveTaskChanges = async () => {
  const payload = {
    name: editedTaskName.value,
    status: editedStatus.value,
    priority: editedPriority.value,
    description: editedDescription.value,
    sprintId: props.task.sprintId,
    prerequisite: editedPrerequisite.value,
    sprintId: editedSprintId.value
  };

  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/task/${props.task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      props.task.name = editedTaskName.value;
      props.task.status = editedStatus.value;
      props.task.priority = editedPriority.value;
      props.task.description = editedDescription.value;
      props.task.prerequisite = props.tasks.find(taskItem => taskItem.id === editedPrerequisite.value);
      props.task.sprintId = editedSprintId.value
    } else {
      const errorData = await response.json();
      console.error("Failed to update task:", errorData);
    }
  } catch (error) {
    console.error("Error updating task:", error);
  }

  isEditingName.value = false;
};
const saveTaskChangesAndRefresh = async () => {
  await saveTaskChanges();
  window.location.reload();
};


// คำนวณตัวย่อของสมาชิก (Initials)
const memberData = computed(() => {
  if (!props.task.assigned) return [];

  // ถ้า task.assigned ไม่ใช่อาร์เรย์ ให้แปลงเป็นอาร์เรย์
  const members = Array.isArray(props.task.assigned) ? props.task.assigned : [props.task.assigned];

  return members.map(member => ({
    username: member.username || "Unknown",
    initials: member.username
      ? (member.username.length > 1
          ? member.username[0].toUpperCase() + member.username[member.username.length - 1].toUpperCase()
          : member.username.toUpperCase())
      : "?"
  }));
});

const newComment = ref("");
const showMovePopup = ref(false);

const addComment = () => {
  if (newComment.value.trim()) {
    props.task.comments.push({ id: Date.now(), user: "You", text: newComment.value });
    newComment.value = "";
  }
};

const applyMove = () => {
  showMovePopup.value = false;
};

const selectedSprint = computed({
  get() {
    return editedSprintId.value;
  },
  set(newSprintId) {
    editedSprintId.value = newSprintId;
  }
});
</script>

<template>
    <div
      v-if="isVisible"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center mt-10"
      @click.self="closeModal"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-[400px] border border-gray-300">
        <!-- Task Title & Status -->
        <div class="flex justify-between items-center mb-3">
          <div @click="startEditing('name')" class="cursor-pointer">
            <input
              v-if="isEditingName"
              v-model="editedTaskName"
              @blur="saveTaskChanges"
              @keyup.enter="saveTaskChanges"
              class="border rounded px-2 py-1 w-full"
            />
            <h2 v-else class="text-lg font-semibold">{{ task.name }}</h2>
          </div>
          <button @click="closeModal" class="text-gray-500 hover:text-red-500">✖</button>
        </div>
        <div class="flex items-end gap-2 text-sm mb-4">
          <div class="flex flex-col">
            <label class="text-xs text-gray-600 mb-1">Status</label>
            <select v-model="editedStatus" @change="saveTaskChanges" class="px-1 text-xs bg-gray-200 rounded">
              <option value="ToDo">TO DO</option>
              <option value="In Progress">IN PROGRESS</option>
              <option value="Done">DONE</option>
            </select>
          </div>
          <div class="flex flex-col">
            <label class="text-xs text-gray-600 mb-1">Priority</label>
            <select v-model="editedPriority" @change="saveTaskChanges" class="px-1 text-xs bg-gray-200 rounded">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button @click="showMovePopup = true" class="bg-blue-500 text-white px-3 py-0.5 rounded text-xs">→ Move</button>
        </div>
  
        <!-- Move Popup -->
        <div v-if="showMovePopup" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" style="z-index: 9999;">
          <div class="bg-white p-4 rounded-lg shadow-lg w-80 border border-gray-300">
            <h3 class="text-md font-semibold mb-2">Move Task</h3>
            <div class="mb-3">
              <label class="text-sm font-medium">Sprint</label>
              <select v-model="selectedSprint" class="w-full border rounded p-2">
                <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
                  Sprint {{ sprint.sprintNumber }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="text-sm font-medium">Status</label>
              <select v-model="editedStatus" class="w-full border rounded p-2">
                <option value="ToDo">TO DO</option>
                <option value="In Progress">IN PROGRESS</option>
                <option value="Done">DONE</option>
              </select>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="showMovePopup = false" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button @click="saveTaskChangesAndRefresh"  class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
            </div>
          </div>
        </div>
  
        <!-- Members Section -->
<!-- Members Section -->
<div class="mb-4">
  <label class="text-sm font-medium">Members</label>
  <div class="flex items-center gap-2 mt-1">
    <span 
      v-for="(member, index) in memberData" 
      :key="index" 
      :data-tip="member.username"
      class="btn tooltip w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-black">
      {{ member.initials }}
    </span>
    <!-- Plus Button to Add Members -->
    <button @click="openMemberModal" class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">+</button>
  </div>
</div>

<!-- Member Selection Modal -->
<div v-if="showMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" style="z-index: 9999;">
  <div class="bg-white p-4 rounded-lg shadow-lg w-80 border border-gray-300">
    <h3 class="text-md font-semibold mb-2">Select Member</h3>
    <div class="mb-3">
      <label class="text-sm font-medium">Available Members</label>
      <select v-model="selectedMember" class="w-full border rounded p-2">
        <option v-for="member in availableMembers" :key="member.id" :value="member.id">
          {{ member.username }}
        </option>
      </select>
    </div>
    <div class="flex justify-end gap-2">
      <button @click="closeMemberModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
      <button @click="addMemberToTask" class="px-4 py-2 bg-blue-500 text-white rounded">Add Member</button>
    </div>
  </div>
</div>

        <!-- Prerequisite Section -->
        <div class="flex flex-col">
          <label class="text-xs text-gray-600 mb-1">Prerequisite</label>
          <select v-model="editedPrerequisite" @change="saveTaskChanges" class="px-1 text-xs bg-gray-200 w-full border rounded p-2">
            <option :value="null">None</option>
            <option v-if="task.prerequisite && task.prerequisite.name !== task.name" :value="task.prerequisite.id">
              {{ task.prerequisite.name }} ({{ task.prerequisite.status }})
            </option>
            <option v-for="taskItem in tasks.filter(item => item.name !== task.prerequisite?.name)" :key="taskItem.id" :value="taskItem.id">
              {{ taskItem.name }} ({{ taskItem.status }})
            </option>
          </select>
        </div>
  
        <!-- Task Dates -->
        <div class="mb-4">
          <label class="text-sm font-medium block mb-1">Task dates</label>
          <div class="flex items-center gap-4">
            <div class="w-1/2">
              <label class="text-xs text-gray-600 block mb-1">Start Date</label>
              <input type="date" v-model="task.startDate" class="border rounded p-2 w-full" />
            </div>
            <div class="w-1/2">
              <label class="text-xs text-gray-600 block mb-1">End Date</label>
              <input type="date" v-model="task.endDate" class="border rounded p-2 w-full" />
            </div>
          </div>
        </div>
  
        <!-- Description -->
        <div class="mb-4">
          <label class="text-sm font-medium">Description</label>
          <textarea v-model="editedDescription" @blur="saveTaskChanges" class="w-full border rounded p-2"></textarea>
        </div>
  
        <!-- Comments Section -->
        <div class="mb-4">
          <label class="text-sm font-medium">Comments</label>
          <input type="text" v-model="newComment" placeholder="Write a comment..." class="w-full border rounded p-2" @keyup.enter="addComment" />
          <div class="mt-2" v-for="comment in task.comments" :key="comment.id">
            <p class="text-sm"><strong>{{ comment.user }}</strong>: {{ comment.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  

  