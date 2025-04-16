<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getProjectById } from "../composable/getJudProjects"; 
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id; 

const projectName = ref('');
const projectDescription = ref('');
const startDate = ref('');
const endDate = ref('');
const loading = ref(true);
const isSubmitDisabled = ref(false);
const editingFields = ref({
  name: false,
  description: false,
  startDate: false,
  endDate: false
});

const fetchProjectData = async () => {
  try {
    loading.value = true; 
    const token = localStorage.getItem('token');
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/project/${projectId}`,
    {
      method: "GET",
      headers: {"Authorization": token,},
    }
    );
    const data = await response.json(); 
    
    if (data) {
      projectName.value = data.name || '';
      projectDescription.value = data.description || '';
      startDate.value = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '';
      endDate.value = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '';
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
  } finally {
    loading.value = false;
  }
};

const formatToISO = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
}; 

const saveProject = async () => {
  isSubmitDisabled.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_ROOT_API}/api/project/${projectId}`, {
      method: 'PUT',
      headers: { 
        "Authorization": token,
        'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName.value,
        description: projectDescription.value,
        startDate: formatToISO(startDate.value),
        dueDate: formatToISO(endDate.value)
      }),
    });

    if (response.ok) {
      // Use a toast or snackbar instead of alert
      console.log("Project updated successfully!");
      // Reset editing state
      Object.keys(editingFields.value).forEach(key => {
        editingFields.value[key] = false;
      });
    } else {
      console.error("Failed to update project");
    }
  } catch (error) {
    console.error("Error updating project:", error);
  } finally {
    isSubmitDisabled.value = false;
  }
};

const deleteProject = async () => {
  // Add confirmation modal
  const confirmDelete = confirm("Are you sure you want to delete this project? This action cannot be undone.");
  
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_ROOT_API}/api/project/${projectId}/delete`, {
      method: 'DELETE',
      headers: { "Authorization": token,},
    });

    if (response.ok) {
      // Use a toast or snackbar instead of alert
      console.log("Project deleted successfully!");
      router.push('/projects');
    } else {
      console.error("Failed to delete project");
      // Use a more user-friendly error notification
      console.log("Failed to delete project. Please try again.");
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    // Use a more user-friendly error notification
    console.log("An error occurred while deleting the project.");
  }
};

const toggleEdit = async (field) => {
  editingFields.value[field] = !editingFields.value[field];

  if (!editingFields.value[field]) {
    if (field === 'name' && isProjectNameTooShort.value) {
      showPopupError("Project name must be more than 5 characters.");
      editingFields.value[field] = true;
      return;
    }
    await saveProject();
  }
};

const isProjectNameTooShort = computed(() => projectName.value.length <= 5);


onMounted(async () => {
  await fetchProjectData();
});

const popupMessage = ref('');
const showPopup = ref(false);

const showPopupError = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
  popupMessage.value = '';
};
</script>


<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
    <NavBar />
    
    <div class="container mx-auto px-4 py-32">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Page Title -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-Black mb-2">Edit Project</h1>
        
        </div>

        <!-- Project Name Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Project Name</h2>
          <div class="flex items-center space-x-4">
            <input
              type="text"
              v-model="projectName"
              :disabled="!editingFields.name"
              class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              :class="{'bg-gray-100': !editingFields.name}"
            />

            <button 
              @click="toggleEdit('name')"
              class="p-2 rounded-full hover:bg-indigo-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
             <p v-if="isProjectNameTooShort" class="text-red-500 text-sm mt-2">
               Project name must be more than 5 characters.
            </p>
        </div>

        <!-- Project Description Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Project Description</h2>
          <div class="flex items-start space-x-4">
            <textarea
              v-model="projectDescription"
              :disabled="!editingFields.description"
              class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-32"
              :class="{'bg-gray-100': !editingFields.description}"
            ></textarea>
            <button 
              @click="toggleEdit('description')"
              class="p-2 rounded-full hover:bg-indigo-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Project Duration Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-blackmb-4">Project Duration</h2>
          
          <!-- Start Date -->
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Start Date</label>
            <div class="flex items-center space-x-4">
              <input
                type="date"
                v-model="startDate"
                :disabled="!editingFields.startDate"
                class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="{'bg-gray-100': !editingFields.startDate}"
              />
              <button 
                @click="toggleEdit('startDate')"
                class="p-2 rounded-full hover:bg-indigo-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-gray-700 mb-2">End Date</label>
            <div class="flex items-center space-x-4">
              <input
                type="date"
                v-model="endDate"
                :disabled="!editingFields.endDate"
                class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="{'bg-gray-100': !editingFields.endDate}"
              />
              <button 
                @click="toggleEdit('endDate')"
                class="p-2 rounded-full hover:bg-indigo-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Delete Project Section -->
        <div class="text-center">
          <button 
            @click="deleteProject"
            class="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
          >
            Delete Project
          </button>
        </div>
        <transition name="fade">
      <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="relative bg-white rounded-lg shadow-2xl px-8 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100">
          <!-- Header with color based on message type -->
          <div class="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-lg"></div>
          
          <!-- Icon and message -->
          <div class="mt-4 mb-2 flex flex-col items-center">
            <div class="bg-red-100 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-lg font-medium text-gray-800">{{ popupMessage }}</p>
          </div>
          
          <!-- Action button -->
          <button 
            @click="closePopup" 
            class="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions for all interactive elements */
input, textarea, button {
  transition: all 0.3s ease;
}

/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>