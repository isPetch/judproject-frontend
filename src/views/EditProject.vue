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
const saveSuccess = ref(false);
const saveError = ref(false);
const errorMessage = ref('');
const showDeleteModal = ref(false);

// Form validation
const errors = ref({
  name: '',
  dates: ''
});

const fetchProjectData = async () => {
  try {
    loading.value = true; 
    const token = localStorage.getItem('token');
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/project/${projectId}`,
    {
      method: "GET",
      headers: {"Authorization": token,},
    });
    
    const data = await response.json(); 
    
    if (data) {
      projectName.value = data.name || '';
      projectDescription.value = data.description || '';
      startDate.value = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '';
      endDate.value = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '';
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
    showNotification('Failed to load project data. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
};

const formatToISO = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
}; 

const validateForm = () => {
  let isValid = true;
  errors.value.name = '';
  errors.value.dates = '';
  
  // Validate project name
  if (projectName.value.length <= 5) {
    errors.value.name = 'Project name must be more than 5 characters';
    isValid = false;
  }
  
  // Validate dates if both are provided
  if (startDate.value && endDate.value) {
    if (new Date(startDate.value) > new Date(endDate.value)) {
      errors.value.dates = 'End date cannot be before start date';
      isValid = false;
    }
  }
  
  return isValid;
};

const saveProject = async () => {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
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
      showNotification('Project successfully updated!', 'success');
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || 'Failed to update project', 'error');
    }
  } catch (error) {
    console.error("Error updating project:", error);
    showNotification('An error occurred while saving. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
};

const confirmDeleteProject = () => {
  showDeleteModal.value = true;
};

const deleteProject = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_ROOT_API}/api/project/${projectId}/delete`, {
      method: 'DELETE',
      headers: { "Authorization": token },
    });

    if (response.ok) {
      showNotification('Project deleted successfully!', 'success');
      setTimeout(() => {
        router.push('/projects');
      }, 1500);
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || 'Failed to delete project', 'error');
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    showNotification('An error occurred while deleting the project.', 'error');
  } finally {
    loading.value = false;
    showDeleteModal.value = false;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
};

// Notification system
const notification = ref({
  show: false,
  message: '',
  type: 'success'
});

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  };
  
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

onMounted(async () => {
  await fetchProjectData();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50">
    <NavBar />
    
    <!-- Loading overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl flex items-center space-x-4">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg font-medium text-gray-700">Processing...</span>
      </div>
    </div>
    
    <!-- Notification toast -->
    <transition name="slide-down">
      <div 
        v-if="notification.show" 
        class="fixed top-20 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3"
        :class="{
          'bg-green-100 border-l-4 border-green-500': notification.type === 'success',
          'bg-red-100 border-l-4 border-red-500': notification.type === 'error'
        }"
      >
        <!-- Success icon -->
        <div v-if="notification.type === 'success'" class="flex-shrink-0">
          <svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <!-- Error icon -->
        <div v-if="notification.type === 'error'" class="flex-shrink-0">
          <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <div class="flex-1">
          <p class="text-sm font-medium" :class="{
            'text-green-800': notification.type === 'success',
            'text-red-800': notification.type === 'error'
          }">
            {{ notification.message }}
          </p>
        </div>
      </div>
    </transition>
    
    <!-- Delete confirmation modal -->
    <transition name="fade">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full transform transition-all duration-300">
          <div class="text-center mb-6">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg class="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">Delete Project</h3>
            <p class="mt-2 text-gray-600">Are you sure you want to delete this project? This action cannot be undone.</p>
          </div>
          
          <div class="flex justify-center space-x-4">
            <button 
              @click="cancelDelete"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="deleteProject"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Main content -->
    <div class="container mx-auto px-4 pt-24 pb-16">
      <div class="max-w-3xl mx-auto">
        <!-- Header section with breadcrumbs -->
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <router-link to="/projects" class="hover:text-indigo-600 transition-colors">Projects</router-link>
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>Edit Project</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Edit Project</h1>
          </div>
          
          <div class="mt-4 sm:mt-0">
            <button 
              @click="saveProject"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center shadow-md transition-all transform hover:scale-105"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          </div>
        </div>
        
        <!-- Form card -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <!-- Project name field -->
          <div class="mb-6">
            <label for="project-name" class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <div class="relative">
              <input
                id="project-name"
                type="text"
                v-model="projectName"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter project name"
              />
              <div v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </div>
            </div>
          </div>
          
          <!-- Project description field -->
          <div class="mb-6">
            <label for="project-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div class="relative">
              <textarea
                id="project-description"
                v-model="projectDescription"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-40 resize-none"
                placeholder="Describe your project"
              ></textarea>
              <div class="absolute bottom-3 right-3 text-xs text-gray-400">
                {{ projectDescription.length }} characters
              </div>
            </div>
          </div>
          
          <!-- Project dates -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Start date -->
            <div>
              <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                id="start-date"
                type="date"
                v-model="startDate"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <!-- End date -->
            <div>
              <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                id="end-date"
                type="date"
                v-model="endDate"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div v-if="errors.dates" class="mt-1 text-sm text-red-600">
            {{ errors.dates }}
          </div>
        </div>
        
        <!-- Delete project section -->
        <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Danger Zone</h2>
          <p class="text-gray-600 mb-4">Once you delete this project, there is no going back. Please be certain.</p>
          <button 
            @click="confirmDeleteProject"
            class="px-5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-600 rounded-lg flex items-center transition-colors"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Project
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Focus effects */
input:focus, textarea:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Input placeholders */
input::placeholder, textarea::placeholder {
  color: #a0aec0;
}
</style>