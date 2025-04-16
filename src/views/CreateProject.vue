<script setup>
import { ref, onMounted, computed, watch } from 'vue'; 
import { getAllProjects } from "../composable/getJudProjects";
import { getAllUsers } from '../composable/getJudProjects'
import { useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';

const projects = ref([]);
const isLoading = ref(false);

const fetchProjects = async () => {
  isLoading.value = true;
  try {
    const response = await getAllProjects();
    if (response.status === 'success') {
      projects.value = response.data;
    } else {
      console.error('Error fetching projects:', response.message);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    isLoading.value = false;
  }
};

const router = useRouter();

const goToListProject = () => {
  router.push({ name: 'Listprojects' });
};

onMounted(fetchProjects);

const projectName = ref('');
const projectDescription = ref('');
const startDate = ref('');
const endDate = ref('');

const isSubmitDisabled = computed(() => {
  return (
    !projectName.value.trim() ||
    projectName.value.trim().length < 5 || // เพิ่มตรงนี้
    !projectDescription.value.trim()
  );
});


const addCreateProject = async () => {
  if (!isSubmitDisabled.value) {
    const projectData = {
      name: projectName.value,
      description: projectDescription.value,
      ...(startDate.value && { startDate: new Date(startDate.value).toISOString() }),
      ...(endDate.value && { dueDate: new Date(endDate.value).toISOString() }),
    };

    // หากมีสมาชิกใน teamMembers ก็จะส่งไปด้วย
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
        await response.json();
         goToListProject(); 
      } else {
        goToListProject(); 
        console.error('Failed to add project');
      }
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

const CancleCreateProject = () => {
  projectName.value = '';
  projectDescription.value = '';
  startDate.value = '';
  endDate.value = '';
};

const availableEmails = ref([]);
const searchEmail = ref('');
const selectedRole = ref('');
const teamMembers = ref([]);
const selectedEmail = ref('');

const filteredEmails = computed(() => {
  return availableEmails.value.filter(email => 
    email.toLowerCase().includes(searchEmail.value.trim().toLowerCase())
  );
});
const selectEmail = (email) => {
  searchEmail.value = email;
  selectedEmail.value = email;
  fetchUsers();
};

watch(searchEmail, () => {
  selectedEmail.value = '';
});
watch(teamMembers, () => {
  fetchUsers();
});

const fetchUsers = async () => {
  const response = await getAllUsers();
  if (response) {
    availableEmails.value = response.users.map((user) => user.email);
  }
};

onMounted(() => {
  fetchUsers();
});

const addMember = () => {
  if (searchEmail.value && selectedRole.value) {
    teamMembers.value.push({ email: searchEmail.value, role: selectedRole.value });
    searchEmail.value = ''; 
    selectedRole.value = ''; 
  }
};

const removeMember = (index) => {
  teamMembers.value.splice(index, 1);
};

</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
    <NavBar />
    
    <div class="container mx-auto px-4 py-32">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Page Title -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-Black mb-2">Create Project</h1>
        </div>

        <!-- Project Name Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Project Name</h2>
          <input
            v-model="projectName"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            :class="{'border-red-500': !projectName.trim() && isSubmitDisabled}"
            placeholder="Enter project name"
          />
           <p v-if="projectName && projectName.trim().length < 5" class="text-red-500 text-sm mt-1">
            Project name must be at least 5 characters.
           </p>
        </div>

        <!-- Project Description Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Project Description</h2>
          <textarea
            v-model="projectDescription"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all h-32"
            :class="{'border-red-500': !projectDescription.trim() && isSubmitDisabled}"
            placeholder="Enter project description"
          ></textarea>
        </div>

        <!-- Project Duration Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Project Duration</h2>
          
          <!-- Start Date -->
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              v-model="startDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              v-model="endDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Team Members Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h2 class="text-xl font-semibold text-black mb-4">Team Members</h2>
          
          <!-- Email Search -->
          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Add Team Members</label>
            <div class="flex items-center space-x-4">
              <input 
                v-model="searchEmail" 
                type="text" 
                placeholder="Search email..."
                class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <select 
                v-model="selectedRole" 
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Select Role</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button 
                @click="addMember" 
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                Add
              </button>
            </div>
            
            <!-- Email Suggestions -->
            <ul v-if="searchEmail && !selectedEmail" class="mt-2 border rounded-md max-h-32 overflow-y-auto">
              <li 
                v-for="(email, index) in filteredEmails.slice(0, 10)" 
                :key="index" 
                @click="selectEmail(email)" 
                class="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {{ email }}
              </li>
            </ul>
          </div>

          <!-- Team Members List -->
          <div>
            <label class="block text-gray-700 mb-2">Current Team Members</label>
            <div class="border rounded-lg p-4 max-h-32 overflow-y-auto bg-gray-200">
              <ul>
                <li 
                  v-for="(member, index) in teamMembers" 
                  :key="index" 
                  class="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <span>{{ member.email }} ({{ member.role }})</span>
                 <button 
                @click="removeMember(index)" 
                class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all"
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

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <button 
            @click="addCreateProject" 
            :disabled="isSubmitDisabled"
            class="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
          <button 
            @click="CancleCreateProject, goToListProject()" 
            class="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all transform hover:scale-105"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions for all interactive elements */
input, textarea, button, select {
  transition: all 0.3s ease;
}

/* Custom scrollbar for textarea and lists */
textarea::-webkit-scrollbar,
.max-h-32::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track,
.max-h-32::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb,
.max-h-32::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb:hover,
.max-h-32::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>