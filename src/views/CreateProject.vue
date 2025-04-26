<script setup>
import { ref, onMounted, computed, watch } from 'vue'; 
import { getAllProjects } from "../composable/getJudProjects";
import { getAllUsers } from '../composable/getJudProjects'
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';

const projects = ref([]);
const isLoading = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);
const errorMessage = ref('');

// Form validation
const errors = ref({
  name: '',
  description: '',
  dates: '',
  teamMembers: ''
});

const router = useRouter();

const goToListProject = () => {
  router.push({ name: 'Listprojects' });
};

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const response = await getAllProjects();
    if (response.ok || response.message.includes('success')) {
  projects.value = response.data;
} else {
  showNotification('Error fetching projects: ' + response.message, 'error');
}
  } catch (error) {
    showNotification('Failed to load projects', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchProjects);

const projectName = ref('');
const projectDescription = ref('');
const startDate = ref('');
const endDate = ref('');

const validateForm = () => {
  let isValid = true;
  errors.value.name = '';
  errors.value.description = '';
  errors.value.dates = '';
  
  // Validate project name
  if (!projectName.value.trim()) {
    errors.value.name = 'Project name is required';
    isValid = false;
  } else if (projectName.value.trim().length < 5) {
    errors.value.name = 'Project name must be at least 5 characters';
    isValid = false;
  }
  
  // Validate description
  if (!projectDescription.value.trim()) {
    errors.value.description = 'Project description is required';
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

const addCreateProject = async () => {
  if (!validateForm()) {
    return;
  }

  const projectData = {
    name: projectName.value,
    description: projectDescription.value,
    ...(startDate.value && { startDate: new Date(startDate.value).toISOString() }),
    ...(endDate.value && { dueDate: new Date(endDate.value).toISOString() }),
  };

  // Include team members if any exist
  if (teamMembers.value.length > 0) {
    projectData.member = teamMembers.value;
  }

  try {
    const token = localStorage.getItem('token');
    isLoading.value = true;
    
    const response = await fetch(import.meta.env.VITE_ROOT_API + '/api/project', {
      method: 'POST',
      headers: {
        "Authorization": token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (response.ok) {
      showNotification('Project created successfully!', 'success');
      setTimeout(() => {
        goToListProject();
      }, 1500);
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || 'Failed to create project', 'error');
    }
  } catch (error) {
    showNotification('An error occurred while creating the project', 'error');
  } finally {
    isLoading.value = false;
  }
};

const cancelCreateProject = () => {
  projectName.value = '';
  projectDescription.value = '';
  startDate.value = '';
  endDate.value = '';
  teamMembers.value = [];
  goToListProject();
};

const availableEmails = ref([]);
const searchEmail = ref('');
const selectedRole = ref('');
const teamMembers = ref([]);
const selectedEmail = ref('');
const showEmailDropdown = ref(false);

const filteredEmails = computed(() => {
  if (!searchEmail.value.trim()) return [];
  
  return availableEmails.value.filter(email => 
    email.toLowerCase().includes(searchEmail.value.trim().toLowerCase())
  );
});

const selectEmail = (email) => {
  searchEmail.value = email;
  selectedEmail.value = email;
  showEmailDropdown.value = false;
};

watch(searchEmail, () => {
  selectedEmail.value = '';
  if (searchEmail.value.trim()) {
    showEmailDropdown.value = true;
  } else {
    showEmailDropdown.value = false;
  }
});

watch(teamMembers, () => {
  fetchUsers();
});

const fetchUsers = async () => {
  try {
    const response = await getAllUsers();
    if (response) {
      // Filter out emails that are already in the team
      const currentEmails = teamMembers.value.map(member => member.email);
      availableEmails.value = response.users
        .map(user => user.email)
        .filter(email => !currentEmails.includes(email));
    }
  } catch (error) {
    showNotification('Failed to fetch users', 'error');
  }
};

onMounted(() => {
  fetchUsers();
});

const addMember = () => {
  errors.value.teamMembers = '';
  
  if (!searchEmail.value.trim()) {
    errors.value.teamMembers = 'Email is required';
    return;
  }
  
  if (!selectedRole.value) {
    errors.value.teamMembers = 'Role is required';
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(searchEmail.value)) {
    errors.value.teamMembers = 'Please enter a valid email address';
    return;
  }
  
  // Check if email already exists in team
  if (teamMembers.value.some(member => member.email === searchEmail.value)) {
    errors.value.teamMembers = 'This email is already in the team';
    return;
  }
  
  teamMembers.value.push({ email: searchEmail.value, role: selectedRole.value });
  searchEmail.value = '';
  selectedRole.value = '';
  showEmailDropdown.value = false;
};

const removeMember = (index) => {
  teamMembers.value.splice(index, 1);
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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-blue-50">
    <NavBar />
    
    <!-- Loading overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <span>Create Project</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Create Project</h1>
          </div>
          
          <div class="mt-4 sm:mt-0">
            <button 
              @click="addCreateProject"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center shadow-md transition-all transform hover:scale-105"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
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
            <div v-if="errors.description" class="mt-1 text-sm text-red-600">
              {{ errors.description }}
            </div>
          </div>
          
          <!-- Project dates -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
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
          
          <div v-if="errors.dates" class="mb-6 text-sm text-red-600">
            {{ errors.dates }}
          </div>
        </div>
        
        <!-- Team Members card -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-medium text-gray-900 mb-4">Team Members</h2>
          
          <!-- Add team member section -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Add Team Member</label>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div class="sm:col-span-2 relative">
                <input 
                  v-model="searchEmail" 
                  type="text" 
                  placeholder="Email address"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <!-- Email dropdown -->
                <div v-if="showEmailDropdown && filteredEmails.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div 
                    v-for="(email, index) in filteredEmails.slice(0, 5)" 
                    :key="index" 
                    @click="selectEmail(email)" 
                    class="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700"
                  >
                    {{ email }}
                  </div>
                </div>
              </div>
              
              <div>
                <select 
                  v-model="selectedRole" 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Select Role</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <button 
                  @click="addMember" 
                  class="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-all"
                >
                  <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
            
            <div v-if="errors.teamMembers" class="mt-2 text-sm text-red-600">
              {{ errors.teamMembers }}
            </div>
          </div>
          
          <!-- Team Members List -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Current Team Members</h3>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div v-if="teamMembers.length === 0" class="p-6 text-center text-gray-500 bg-gray-50">
                No team members added yet
              </div>
              <ul v-else>
                <li 
                  v-for="(member, index) in teamMembers" 
                  :key="index" 
                  class="flex justify-between items-center px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      {{ member.email.charAt(0).toUpperCase() }}
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-700">{{ member.email }}</p>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                        'bg-blue-100 text-blue-800': member.role === 'member',
                        'bg-purple-100 text-purple-800': member.role === 'admin'
                      }">
                        {{ member.role }}
                      </span>
                    </div>
                  </div>
                  <button 
                    @click="removeMember(index)" 
                    class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer action buttons -->
        <div class="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
          <button 
            @click="cancelCreateProject" 
            class="order-2 sm:order-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          
          <button 
            @click="addCreateProject" 
            class="order-1 sm:order-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Project
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

/* Custom scrollbar for textarea and dropdown */
textarea::-webkit-scrollbar,
.max-h-48::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track,
.max-h-48::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb,
.max-h-48::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb:hover,
.max-h-48::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Focus effects */
input:focus, textarea:focus, select:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Input placeholders */
input::placeholder, textarea::placeholder {
  color: #a0aec0;
}

/* Custom select appearance */
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
}
</style>