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
   return !projectName.value.trim() || 
         !projectDescription.value.trim() ; 
         
});

const addCreateProject = async () => {
  if (!isSubmitDisabled.value) {
    const projectData = {
      name: projectName.value,
      description: projectDescription.value,
      ...(startDate.value && { startDate: new Date(startDate.value).toISOString() }),
      ...(endDate.value && { dueDate: new Date(endDate.value).toISOString() }),
    };

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
  if (response && response.status === "Success") {
    availableEmails.value = response.users.map(user => user.email);
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
 <div class="min-h-screen  from-indigo-100 bg-gray-50 flex flex-col">
    <NavBar />
    <div class="px-4 py-20">
        <!-- Header -->
        <div class="mt-4 p-6 text-center">
          <h2 class="text-4xl font-extrabold text-black tracking-tight">Create Project</h2>
        </div>
         <hr>
    <div class="flex justify-center p-4">
      <div class="w-full max-w-2xl">
        <!-- Form Inputs -->
     <div class="space-y-6">
  <div class="bg-white rounded-lg shadow-md p-4">
    <label class="block font-semibold text-gray-700 mb-2">Project Name</label>
    <input v-model="projectName" type="text" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" 
      :class="{'border-red-500': !projectName.trim() && isSubmitDisabled}" />
  </div>

  <div class="bg-white rounded-lg shadow-md p-4">
    <label class="block font-semibold text-gray-700 mb-2">Project Description</label>
    <textarea v-model="projectDescription" class="w-full p-3 border rounded-lg shadow-sm h-32 focus:ring focus:ring-blue-300" 
      :class="{'border-red-500': !projectDescription.trim() && isSubmitDisabled}"></textarea>
  </div>

  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="mt-2 space-y-4">
      <label class="block font-semibold text-gray-700">Project Duration</label>
      <div>
        <p class="text-sm text-gray-600 mb-2">Start Date</p>
        <input v-model="startDate" type="date" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">End Date</p>
        <input v-model="endDate" type="date" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
      </div>
    </div>
  </div>

  <!-- Team Section -->
  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="space-y-6">
      <div>
        <label class="text-base font-semibold text-gray-700 mb-2">Add Team Members</label>
        <input v-model="searchEmail" type="text" placeholder="Search email..." 
          class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
        <ul v-if="searchEmail && !selectedEmail" class="bg-white border rounded-md mt-2 max-h-32 overflow-y-auto shadow-md">
          <li v-for="(email, index) in filteredEmails.slice(0, 10)" :key="index" 
            @click="selectEmail(email)" class="p-2 cursor-pointer hover:bg-gray-100">
            {{ email }}
          </li>
        </ul>
      </div>

      <div>
        <label class="text-base font-semibold text-gray-700">Role</label>
        <div class="flex items-center gap-2 mt-2">
          <select v-model="selectedRole" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300">
            <option value="">- Select role -</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button @click="addMember" class="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">Add</button>
        </div>
      </div>

      <div>
        <label class="text-base font-semibold text-gray-700 ">Team Members</label>
        <div class="w-full h-24 bg-gray-200 rounded-lg p-3 overflow-y-auto shadow-sm">
          <ul>
            <li v-for="(member, index) in teamMembers" :key="index" class="flex justify-between items-center py-1">
              <span class="truncate text-gray-700">{{ member.email }} ({{ member.role }})</span>
              <button @click="removeMember(index)" class="text-red-500 font-bold px-2 hover:text-red-700">&times;</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</div>

    <hr class="w-full border-t-2 border-gray-300 my-4" />
    <div class="flex justify-center space-x-4 items-center">
      <button @click="addCreateProject" :disabled="isSubmitDisabled" class="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-blue-700" :class="{'bg-gray-400 cursor-not-allowed': isSubmitDisabled}">Submit</button>
      <button @click="CancleCreateProject, goToListProject()" class="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-red-700">Cancel</button>
    </div>
  </div>
   </div>
  
  
</template>

<style scoped>
input, textarea, select {
  border: 1px solid #d1d5db;
}
hr {
  width: 100%;
  border-top-width: 2px;
  border-color: #d1d5db;
}
</style>