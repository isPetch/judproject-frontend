<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";
import { getProjectById } from "../composable/getJudProjects"; // Use this instead of fetch

const projectId = 2;

const projectName = ref('');
const projectDescription = ref('');
const startDate = ref('');
const endDate = ref('');
const teamMembers = ref([]);
const loading = ref(true);

const fetchProjectData = async () => {
  try {
    const response = await getProjectById(projectId); // Use the function to fetch project by ID
    if (response && response.status === "Success") {
      const projectData = response.project; // Assuming the response has the project object
      
      projectName.value = projectData.name || '';
      projectDescription.value = projectData.description || '';
      
      // Convert startDate and endDate to YYYY-MM-DD format
      startDate.value = projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '';
      endDate.value = projectData.dueDate ? new Date(projectData.dueDate).toISOString().split('T')[0] : '';
      
      teamMembers.value = projectData.teamMembers || [];
    } else {
      console.error('Failed to fetch project data');
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProjectData(); // Fetch data when component is mounted
});
</script>


<template>
  <div class="min-h-screen from-indigo-100 bg-gray-50 flex flex-col">
    <NavBar />
    <div class="px-4 py-20">
      <!-- Header -->
      <div class="mt-4 p-6 text-center">
        <h2 class="text-4xl font-extrabold text-black tracking-tight">Edit Project</h2>
      </div>
      <hr />
      <div class="flex justify-center p-4">
        <div class="w-full max-w-2xl">
          <!-- Form Inputs -->
          <div class="space-y-6">
            <div class="bg-white rounded-lg shadow-md p-4">
              <label class="block font-semibold text-gray-700 mb-2">Project Name</label>
              <input v-model="projectName" type="text" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
            </div>

            <div class="bg-white rounded-lg shadow-md p-4">
              <label class="block font-semibold text-gray-700 mb-2">Project Description</label>
              <textarea v-model="projectDescription" class="w-full p-3 border rounded-lg shadow-sm h-32 focus:ring focus:ring-blue-300"></textarea>
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
                  <input v-model="searchEmail" type="text" placeholder="Search email..." class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
                  <ul v-if="searchEmail && !selectedEmail" class="bg-white border rounded-md mt-2 max-h-32 overflow-y-auto shadow-md">
                    <li v-for="(email, index) in filteredEmails.slice(0, 10)" :key="index" @click="selectEmail(email)" class="p-2 cursor-pointer hover:bg-gray-100">{{ email }}</li>
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
                  <label class="text-base font-semibold text-gray-700">Team Members</label>
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
        <button @click="saveProject" :disabled="isSubmitDisabled" class="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-blue-700" :class="{'bg-gray-400 cursor-not-allowed': isSubmitDisabled}">Save Change</button>
        <button @click="cancelEdit" class="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-red-700">Cancel</button>
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