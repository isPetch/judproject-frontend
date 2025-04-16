<script setup>
import { ref, computed, onMounted, watch } from "vue";

const props = defineProps({
  task: Object,
  tasks: Array,
  sprints: Array,
  isVisible: Boolean,
  closeModal: Function,
  projectId: Number,
  sprintId: String,
});

const emit = defineEmits(["taskUpdated"]);

// State management
const isEditingName = ref(false);
const editedTaskName = ref(props.task?.name || "");
const editedStatus = ref(props.task?.status || "ToDo");
const editedPriority = ref(props.task?.priority || "Medium");
const editedDescription = ref(props.task?.description || "");
const editedPrerequisite = ref(
  props.task?.prerequisite ? props.task.prerequisite.id : null
);
const editedSprintId = ref(props.task?.sprintId);
const editedStartDate = ref(props.task?.startDate ? props.task.startDate.slice(0, 10) : "");
const editedDueDate = ref(props.task?.dueDate ? props.task.dueDate.slice(0, 10) : "");
const sprintData = ref({ projectId: props.projectId });
const showMemberModal = ref(false);
const selectedMember = ref("");
const availableMembers = ref([]);
const showMovePopup = ref(false);
const newComment = ref("");
const isLoading = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);

// Status colors
const statusColors = {
  ToDo: "bg-gray-200 text-gray-800",
  "In Progress": "bg-blue-200 text-blue-800",
  Done: "bg-green-200 text-green-800",
};

// Priority colors
const priorityColors = {
  High: "bg-red-200 text-red-800",
  Medium: "bg-yellow-200 text-yellow-800",
  Low: "bg-green-200 text-green-800",
};

onMounted(() => {
  fetchMembers();
});

// Watch for task changes to update local state
watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      editedTaskName.value = newTask.name || "";
      editedStatus.value = newTask.status || "ToDo";
      editedPriority.value = newTask.priority || "Medium";
      editedDescription.value = newTask.description || "";
      editedPrerequisite.value = newTask.prerequisite ? newTask.prerequisite.id : null;
      editedSprintId.value = newTask.sprintId;
      editedStartDate.value = newTask.startDate ? newTask.startDate.slice(0, 10) : "";
      editedDueDate.value = newTask.dueDate ? newTask.dueDate.slice(0, 10) : "";
    }
  },
  { deep: true }
);

// Fetch picture members
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
    membersImage.value.push("/images/default-profile.png");

  }
};

// Fetch project members
const fetchMembers = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_ROOT_API + `/api/project/${sprintData.value.projectId}/members`,
      {
        method: "GET",
        headers: {  "Authorization": token,"Content-Type": "application/json" },
      }
    );
    if (response.ok) {
      const data = await response.json();
     
      // Fetch รูปภาพของสมาชิกแต่ละคน
      const membersWithImages = await Promise.all(
        data.members.map(async (member) => {
          const imageURL = await fetchMemberPicture(member.memberId); 
          return { ...member, image: imageURL || "/images/default-profile.png" }; 
         
        })
      );

      availableMembers.value = membersWithImages;
      console.log(availableMembers.value);
    } else {
      console.error("Failed to fetch members:", await response.text());
    }
  } catch (error) {
    console.error("Error fetching members:", error);
  } finally {
    isLoading.value = false;
  }
};

// Member modal management
const openMemberModal = () => {
  showMemberModal.value = true;
};

const closeMemberModal = () => {
  showMemberModal.value = false;
  selectedMember.value = "";
};

// Add member to task
const addMemberToTask = async () => {
  if (!selectedMember.value) return;

  const memberIdNum = Number(selectedMember.value);
  const member = availableMembers.value.find((m) => m.memberId === memberIdNum);

  if (member) {
    if (!props.task.assigned) {
      props.task.assigned = [];
    }

    // Check if member is already assigned
    if (!props.task.assigned.some((m) => m.memberId === memberIdNum)) {
      props.task.assigned = [...props.task.assigned, member];
      await saveTaskChanges();
    }

    closeMemberModal();
  }
};

// Remove member from task
const removeMember = async (memberId) => {
  if (confirm("Are you sure you want to remove this member?")) {
    props.task.assigned = props.task.assigned.filter((m) => m.memberId !== memberId);
    await saveTaskChanges();
  }
};

// Task editing
const startEditing = (field) => {
  if (field === "name") {
    isEditingName.value = true;
    editedTaskName.value = props.task.name;
    setTimeout(() => {
      const nameInput = document.getElementById("task-name-input");
      if (nameInput) nameInput.focus();
    }, 10);
  }
};

const finishEditing = async () => {
  if (!editedTaskName.value.trim()) {
    alert("Task name cannot be empty.");
    editedTaskName.value = props.task.name;
    isEditingName.value = false;
    return;
  }

  isEditingName.value = false;
  await saveTaskChanges();
};

// Save task changes
const saveTaskChanges = async () => {
  isLoading.value = true;
  saveSuccess.value = false;
  saveError.value = false;

  // ตรวจสอบเมื่อเปลี่ยนสถานะเป็น Done และมี step ที่ยังไม่ Done
  if (editedStatus.value === "Done" && props.task.steps && props.task.steps.length > 0) {
    const incompleteSteps = props.task.steps.filter((step) => step.status !== "Done");
    if (incompleteSteps.length > 0) {
      const confirmUpdate = confirm(
        "There are still incomplete steps. Would you like to mark all steps as Done?"
      );
      if (confirmUpdate) {
        editedStatus.value = "Done";
        props.task.status = "Done";
        for (const step of incompleteSteps) {
          try {
            const token = localStorage.getItem("token");
            await fetch(import.meta.env.VITE_ROOT_API + `/api/step/${step.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `${token}` },
              body: JSON.stringify({ status: "Done" }),
            });
            step.status = "Done";
          } catch (error) {
            console.error("Error updating step:", error);
          }
        }
      } else {
        // หากผู้ใช้ไม่ยืนยัน ให้คืนค่า editedStatus กลับไปที่ค่าเดิมแล้วออกจากฟังก์ชัน
        editedStatus.value = props.task.status;
        isLoading.value = false;
        return;
      }
    }
  }

  const payload = {
    name: editedTaskName.value,
    status: editedStatus.value,
    priority: editedPriority.value,
    description: editedDescription.value,
    prerequisite: editedPrerequisite.value,
    sprintId: editedSprintId.value,
    startDate: editedStartDate.value ? editedStartDate.value + "T00:00:00Z" : "",
    dueDate: editedDueDate.value ? editedDueDate.value + "T00:00:00Z" : "",
    members: props.task.assigned
      ? props.task.assigned.map((member) => member.memberId)
      : [],
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_ROOT_API + `/api/task/${props.task.id}`,
      {
        method: "PUT",
        headers: { "Authorization": token, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      // อัปเดตข้อมูล task ใน local state
      props.task.name = editedTaskName.value;
      props.task.status = editedStatus.value;
      props.task.priority = editedPriority.value;
      props.task.description = editedDescription.value;
      props.task.prerequisite = props.tasks.find(
        (taskItem) => taskItem.id === editedPrerequisite.value
      );
      props.task.sprintId = editedSprintId.value;
      props.task.startDate = editedStartDate.value;
      props.task.dueDate = editedDueDate.value;

      saveSuccess.value = true;
      emit("taskUpdated", props.task);
      setTimeout(() => {
        saveSuccess.value = false;
      }, 2000);
    } else {
      const errorData = await response.json();
      console.error("Failed to update task:", errorData);
      saveError.value = true;
      setTimeout(() => {
        saveError.value = false;
      }, 2000);
    }
  } catch (error) {
    console.error("Error updating task:", error);
    saveError.value = true;
    setTimeout(() => {
      saveError.value = false;
    }, 2000);
  } finally {
    isLoading.value = false;
  }
};

const saveTaskChangesAndRefresh = async () => {
  await saveTaskChanges();
  showMovePopup.value = false;
  location.reload();
};
const openMoveModal = () => {
  if (editedStatus.value === "Done") {
    alert("Cannot move a task with status Done.");
    return;
  }
  showMovePopup.value = true;
};

// Member info calculation
const memberData = computed(() => {
  if (!props.task.assigned) return [];
  const assignedMembers = Array.isArray(props.task.assigned)
    ? props.task.assigned
    : [props.task.assigned];

  return assignedMembers.map(assignedMember => {
    const fetchedMember = availableMembers.value.find(
      member => member.memberId === assignedMember.memberId
    ) || {};

    console.log(assignedMember.memberId); // 10
    console.log(fetchedMember.memberId);  //  undefined
    const username = fetchedMember.username || assignedMember.username || "Unknown";
    const image = fetchedMember.image || "/images/default-profile.png"; // ใช้ default profile ถ้าไม่มี image
    console.log(image);  // /images/default-profile.png
    const initials = username
      ? (username.length > 1
          ? username[0].toUpperCase() + username[username.length - 1].toUpperCase()
          : username.toUpperCase())
      : "?";
    const color = getRandomPastelColor(username);

    return {
      memberId: assignedMember.memberId,
      username,
      image,
      initials,
      color,
    };
  });
});


// Generate consistent colors for member avatars
function getRandomPastelColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

const username = ref("");

// Fetch the logged-in user's username when the component mounts

const token = localStorage.getItem("userId");

const fetchUserData = async () => {
  if (!token) {
    console.error("Authorization token is missing");
    return;
  }

  try {
    const response = await fetch(import.meta.env.VITE_ROOT_API + "/api/profile", {
      method: "GET",
      headers: { Authorization: `${token}` },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    username.value = data.username;
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};
// Add comment
const addComment = () => {
  if (newComment.value.trim()) {
    if (!props.task.comments) {
      props.task.comments = [];
    }
    const userNameToDisplay = username.value || "You";
    const comment = {
      id: Date.now(),
      user: userNameToDisplay,
      text: newComment.value,
      timestamp: new Date().toISOString(),
    };

    props.task.comments.push(comment);

    // Store comments in localStorage
    localStorage.setItem(
      `task_comments_${props.task.id}`,
      JSON.stringify(props.task.comments)
    );

    newComment.value = "";
  }
};

onMounted(() => {
  fetchUserData();
 

  // save comments in localStorage
  const savedComments = localStorage.getItem(`task_comments_${props.task.id}`);
  if (savedComments) {
    props.task.comments = JSON.parse(savedComments);
  }
});

// Formatted dates
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Time period calculation
const taskDuration = computed(() => {
  if (!props.task.startDate || !props.task.endDate) return null;

  const start = new Date(props.task.startDate);
  const end = new Date(props.task.endDate);

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Sprint selection
const selectedSprint = computed({
  get() {
    return editedSprintId.value;
  },
  set(newSprintId) {
    editedSprintId.value = newSprintId;
  },
});

// Close on escape key press
const handleKeyDown = (e) => {
  if (e.key === "Escape") {
    props.closeModal();
  }
};


onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }
);
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start overflow-y-auto py-10 z-50"
    @click.self="closeModal"
  >
    <div
      class="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 transform transition-all duration-300 border-0 overflow-hidden"
    >
      <!-- Colored header based on status -->
      <div :class="['px-6 py-4 flex justify-between items-center bg-gray-200']">
        <div class="flex-1 mr-2">
          <input
            v-if="isEditingName"
            id="task-name-input"
            v-model="editedTaskName"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            class="w-full px-2 py-1 text-lg font-bold bg-white bg-opacity-80 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task name"
          />
          <h2
            v-else
            @click="startEditing('name')"
            class="text-lg font-bold cursor-pointer hover:underline truncate"
          >
            {{ task.name }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <!-- Success/Error notifications -->
          <span v-if="saveSuccess" class="text-green-600 text-sm">✓ Saved</span>
          <span v-if="saveError" class="text-red-600 text-sm">❌ Error</span>

          <button
            @click="closeModal"
            class="text-gray-700 hover:text-gray-900 rounded-full p-1 hover:bg-gray-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Task body -->
      <div class="p-6">
        <!-- Status and Priority section -->
        <div class="flex flex-wrap gap-4 mb-6">
          <div class="flex-1 min-w-[150px]">
            <label class="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              v-model="editedStatus"
              @change="saveTaskChanges"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ToDo">TO DO</option>
              <option value="In Progress">IN PROGRESS</option>
              <option value="Done">DONE</option>
            </select>
          </div>

          <div class="flex-1 min-w-[150px]">
            <label class="text-sm font-medium text-gray-700 block mb-1">Priority</label>
            <select
              v-model="editedPriority"
              @change="saveTaskChanges"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              @click="openMoveModal"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Move
            </button>
          </div>
        </div>

        <!-- Status indicators -->
        <div class="flex flex-wrap gap-3 mb-6">
          <div
            :class="[
              'px-3 py-1 rounded-full text-sm',
              statusColors[editedStatus] || 'bg-gray-200',
            ]"
          >
            {{ editedStatus }}
          </div>
          <div
            :class="[
              'px-3 py-1 rounded-full text-sm',
              priorityColors[editedPriority] || 'bg-gray-200',
            ]"
          >
            {{ editedPriority }} Priority
          </div>
          <div
            v-if="taskDuration"
            class="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm"
          >
            {{ taskDuration }} days
          </div>
        </div>

        <!-- Members Section -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-700 block mb-2"
            >Assigned Members</label
          >
          <div class="flex flex-wrap items-center gap-2">
            <div
              v-for="member in memberData"
              :key="member.memberId"
              class="group relative"
            >
              <!-- Member Avatar with Tooltip -->
              <div
                :style="{ backgroundColor: member.color }"
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-gray-800 border border-gray-300 shadow-sm cursor-pointer transition-transform hover:scale-110 relative"
                :title="member.username"
              >
                <!-- Show image if available, otherwise show initials -->
                <img
                  v-if="member.image"
                  :src="member.image"
                  alt="Profile Picture"
                  class="w-full h-full object-cover rounded-full"
                  @error="member.image = null"
                />
                <span v-else>
                  {{ member.initials }}
                  
                </span>

                <!-- Custom tooltip that shows on hover -->
                <div
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200"
                >
                  {{ member.username }}
                  <!-- Tooltip arrow -->
                  <div
                    class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                  ></div>
                </div>
              </div>

              <!-- Remove member button - appears on hover -->
              <button
                @click="removeMember(member.memberId)"
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove member"
              >
                ×
              </button>
            </div>

            <!-- Add Member Button -->
            <button
              @click="openMemberModal"
              class="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
              title="Add member"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Prerequisite Section -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-700 block mb-1"
            >Prerequisite Task</label
          >
          <select
            v-model="editedPrerequisite"
            @change="saveTaskChanges"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="null">None</option>
            <option
              v-for="taskItem in tasks.filter((item) => item.id !== task.id)"
              :key="taskItem.id"
              :value="taskItem.id"
              :disabled="taskItem.id === task.id"
            >
              {{ taskItem.name }} ({{ taskItem.status }})
            </option>
          </select>
        </div>

        <!-- Task Dates -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-700 block mb-2">Task Period</label>
          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[150px]">
              <label class="text-xs text-gray-600 block mb-1">Start Date</label>
              <input
                type="date"
                v-model="editedStartDate"
                @change="saveTaskChanges"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="flex-1 min-w-[150px]">
              <label class="text-xs text-gray-600 block mb-1">Due Date</label>
              <input
                type="date"
                v-model="editedDueDate"
                @change="saveTaskChanges"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-700 block mb-1">Description</label>
          <textarea
            v-model="editedDescription"
            @blur="saveTaskChanges"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
            placeholder="Add a description for this task..."
          ></textarea>
        </div>

        <!-- Comments Section -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">Comments</label>
          <div class="flex items-center gap-2 mb-3">
            <input
              type="text"
              v-model="newComment"
              placeholder="Write a comment..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @keyup.enter="addComment"
            />
            <button
              @click="addComment"
              class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
              :disabled="!newComment.trim()"
            >
              Add
            </button>
          </div>

          <!-- Comments list -->
          <div class="mt-3 space-y-3 max-h-[200px] overflow-y-auto p-1">
            <div
              v-if="task.comments && task.comments.length > 0"
              v-for="comment in [...task.comments].sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )"
              :key="comment.id"
              class="bg-gray-50 p-3 rounded-lg"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm text-gray-900">{{ comment.user }}</span>
                <span class="text-xs text-gray-500">{{
                  comment.timestamp
                    ? new Date(comment.timestamp).toLocaleString()
                    : "Just now"
                }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ comment.text }}</p>
            </div>
            <div v-else class="text-sm text-gray-500 text-center py-4">
              No comments yet
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Move Task Modal -->
  <div
    v-if="showMovePopup"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]"
    @click.self="showMovePopup = false"
  >
    <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border-0 mx-4">
      <h3 class="text-lg font-bold mb-4 border-b pb-2">Move Task</h3>

      <div class="mb-4">
        <label class="text-sm font-medium text-gray-700 block mb-1">Sprint</label>
        <select
          v-model="selectedSprint"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
            Sprint {{ sprint.sprintNumber }}
          </option>
        </select>
      </div>

      <div class="mb-6">
        <label class="text-sm font-medium text-gray-700 block mb-1">Status</label>
        <select
          v-model="editedStatus"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ToDo">TO DO</option>
          <option value="In Progress">IN PROGRESS</option>
        </select>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="showMovePopup = false"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="saveTaskChangesAndRefresh"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="animate-spin mr-2">⟳</span>
          <span>Move Task</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Member Selection Modal -->
  <div
    v-if="showMemberModal"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]"
    @click.self="closeMemberModal"
  >
    <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border-0 mx-4">
      <h3 class="text-lg font-bold mb-4 border-b pb-2">Add Team Member</h3>

      <div class="mb-6">
        <label class="text-sm font-medium text-gray-700 block mb-1">Select Member</label>
        <select
          v-model="selectedMember"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option disabled value="">-- Select a team member --</option>
          <option
            v-for="member in availableMembers"
            :key="member.memberId"
            :value="member.memberId"
            :disabled="
              props.task.assigned &&
              props.task.assigned.some((m) => m.memberId === member.memberId)
            "
          >
            {{ member.username }}
          </option>
        </select>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="closeMemberModal"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="addMemberToTask"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
          :disabled="!selectedMember || isLoading"
        >
          <span v-if="isLoading" class="animate-spin mr-2">⟳</span>
          <span>Add Member</span>
        </button>
      </div>
    </div>
  </div>
</template>
