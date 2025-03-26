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
const searchEmail = ref('');
const selectedEmail = ref('');
const selectedRole = ref('');
const loading = ref(true);
const isSubmitDisabled = ref(false);
const isEditingName = ref(false);
const isEditingDescription = ref(false);
const isEditingStartDate = ref(false);
const isEditingEndDate = ref(false);



const fetchProjectData = async () => {
  try {
    loading.value = true; 
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/project/${projectId}`);
    const data = await response.json(); 
    console.log("Project Data:", data); 
    
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
    const response = await fetch(`${import.meta.env.VITE_ROOT_API}/api/project/${projectId}`
    , {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName.value,
        description: projectDescription.value,
        startDate: formatToISO(startDate.value),
        dueDate: formatToISO(endDate.value)
        // teamMembers: teamMembers.value
        
      }),
    });

    if (response.ok) {
      alert("Project updated successfully!");
    } else {
      console.error("Failed to update project");
    }
  } catch (error) {
    console.error("Error updating project:", error);
  } finally {
    isSubmitDisabled.value = false;
  }
};



const toggleEdit = async (field) => {
  if (field === 'name') {
    isEditingName.value = !isEditingName.value;
    if (!isEditingName.value) await saveProject();
  } else if (field === 'description') {
    isEditingDescription.value = !isEditingDescription.value;
    if (!isEditingDescription.value) await saveProject();
  } else if (field === 'startDate') {
    isEditingStartDate.value = !isEditingStartDate.value;
    if (!isEditingStartDate.value) await saveProject();
  } else if (field === 'endDate') {
    isEditingEndDate.value = !isEditingEndDate.value;
    if (!isEditingEndDate.value) await saveProject();
  }
};

onMounted(async () => {
  await fetchProjectData();
  await fetchProjectMembers(projectId);
  
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
      <hr>
      
      <div class="p-8 bg-gray-50">
        <div class="flex justify-center">
          <div class="space-y-6 w-3/4 md:w-1/2 lg:w-6/5">
            <!-- Project Name Field -->
            <div class="bg-white rounded-lg shadow-md p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <div class="flex items-center space-x-3">
                <input
                  type="text"
                  class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  :disabled="!isEditingName"
                  v-model="projectName"
                />
                <button 
                  v-if="!isEditingName" 
                  @click="toggleEdit('name')"
                  class="text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  v-if="isEditingName" 
                  @click="toggleEdit('name')"
                  class="px-4 py-2 rounded-md text-white transition-colors"
                  :class="projectName.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
                  :disabled="!projectName.trim()"
                >
                  Save
                </button>
              </div>
            </div>

            <!-- Project Description Field -->
            <div class="bg-white rounded-lg shadow-md p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
              <div class="flex items-center space-x-3">
                <textarea
                  class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-32"
                  :disabled="!isEditingDescription"
                  v-model="projectDescription"
                ></textarea>
                <div class="flex flex-col space-y-2">
                  <button 
                    v-if="!isEditingDescription" 
                    @click="toggleEdit('description')"
                    class="text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    v-if="isEditingDescription" 
                    @click="toggleEdit('description')"
                    class="px-4 py-2 rounded-md text-white transition-colors"
                    :class="projectDescription.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
                    :disabled="!projectDescription.trim()"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
<!-- Project Duration Fields -->
<div class="bg-white rounded-lg shadow-md p-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">Project Duration</label>

  <!-- Start Date -->
  <div class="flex items-center space-x-3 mt-2">
    <input
      type="date"
      class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
      :disabled="!isEditingStartDate"
      v-model="startDate"
    />
    <button 
      v-if="!isEditingStartDate" 
      @click="toggleEdit('startDate')"
      class="text-indigo-500 hover:text-indigo-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
    <button 
      v-if="isEditingStartDate" 
      @click="toggleEdit('startDate')"
      class="px-4 py-2 rounded-md text-white transition-colors"
      :class="startDate ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
      :disabled="!startDate"
    >
      Save
    </button>
  </div>

  <!-- End Date -->
  <div class="flex items-center space-x-3 mt-2">
    <input
      type="date"
      class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
      :disabled="!isEditingEndDate"
      v-model="endDate"
    />
    <button 
      v-if="!isEditingEndDate" 
      @click="toggleEdit('endDate')"
      class="text-indigo-500 hover:text-indigo-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
    <button 
      v-if="isEditingEndDate" 
      @click="toggleEdit('endDate')"
      class="px-4 py-2 rounded-md text-white transition-colors"
      :class="endDate ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'"
      :disabled="!endDate"
    >
      Save
    </button>
  </div>
</div>

            
          </div>
        </div>
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