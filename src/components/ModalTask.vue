<script setup>
import { ref, computed  } from "vue";

const props = defineProps({
  task: Object,
  sprints: Array,
  isVisible: Boolean,
  closeModal: Function,
});


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
</script>

<template>
    <div
      v-if="isVisible"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      @click.self="closeModal"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-[400px] border border-gray-300">
        <!-- Task Title & Status -->
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">{{ task.name }}</h2>
          <button @click="closeModal" class="text-gray-500 hover:text-red-500">✖</button>
        </div>
        <div class="flex items-center gap-2 text-sm mb-4">
          <span class="px-3 py-1 bg-gray-200 rounded-full">{{ task.status }}</span>
          <button @click="showMovePopup = true" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">→ Move</button>
        </div>
  
        <!-- Move Popup -->
        <div v-if="showMovePopup" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div class="bg-white p-4 rounded-lg shadow-lg w-80 border border-gray-300">
            <h3 class="text-md font-semibold mb-2">Move Task</h3>
            <div class="mb-3">
              <label class="text-sm font-medium">Sprint</label>
              <select v-model="task.sprintId" class="w-full border rounded p-2">
              <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.sprintNumber">
                Sprint {{ sprint.sprintNumber }}
              </option>
            </select>
            </div>
            <div class="mb-3">
              <label class="text-sm font-medium">Status</label>
              <select v-model="task.status" class="w-full border rounded p-2">
                <option value="ToDo">TO DO</option>
                <option value="In Progress">IN PROGRESS</option>
                <option value="Done">DONE</option>
              </select>
            </div>
            <div class="flex justify-end gap-2">
              <button @click="showMovePopup = false" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button @click="applyMove" class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
            </div>
          </div>
        </div>
  
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
            <button class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">+</button>
          </div>
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
          <textarea v-model="task.description" class="w-full border rounded p-2"></textarea>
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
  

  