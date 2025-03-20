<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from "@/components/NavBar.vue";


const router = useRouter();
const editingProject = ref({ name: '', description: '', dueDate: '' }); 
const openSettingPopup = (project) => {
  // แปลง dueDate เป็น YYYY-MM-DD
  const formattedDate = project.dueDate 
    ? new Date(project.dueDate).toISOString().split('T')[0] 
    : ''; // ตรวจสอบว่ามีค่าหรือไม่
  
  editingProject.value = { 
    ...project, 
    dueDate: formattedDate // ใช้ค่าที่แปลงแล้ว
  }; 
  isSettingPopupOpen.value = true;
};

const closeSettingPopup = () => {
  isSettingPopupOpen.value = false;
  editingProject.value = { name: '', description: '', dueDate: '' }; // รีเซ็ตข้อมูล
};
const saveProjectChanges = async () => {
  try {
    const updatedProject = {
      ...editingProject.value,
      dueDate: editingProject.value.dueDate 
        ? new Date(editingProject.value.dueDate).toISOString() 
        : null, // แปลงเป็น ISO format หรือใส่ null ถ้าไม่มีค่า
    };
    
    const response = await fetch(import.meta.env.VITE_ROOT_API + `/api/project/${editingProject.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });

    const result = await response.json();
    console.log('API response:', result);

    if (result && result.status === 'success') {
      console.log('Project updated successfully:', result.data);

      if (result.data) {
        // อัปเดตข้อมูลใน projects list
        const index = projects.value.findIndex((p) => p.id === result.data.id);
        if (index !== -1) {
          projects.value[index] = result.data;
        }
      } else {
        console.warn('No updated project data returned from API');
      }

      closeSettingPopup(); // ปิด Popup หลังจาก Save สำเร็จ
      window.location.reload();
    } else {
      console.error('Error updating project:', result.message);
    }
  } catch (error) {
    console.error('Error updating project:', error.message);
  }
};

</script>

<template>
  <NavBar />
   
     <div class="mt-20 p-8">
    <h2 class="text-4xl font-bold mb-8 text-center">Edit Project</h2>
<hr class="w-full border-gray-300 border-t-2 p-2" />
<!-- Form Section -->
<div class="flex justify-center">
  <div class="w-full max-w-2xl">
    <!-- Form Inputs -->
    <div class="space-y-4">
      <!-- Project Name -->
      <div>
        <label class="block font-semibold text-gray-700">Project Name</label>
        <input v-model="projectName" type="text" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
      </div>

      <!-- Project Description -->
      <div>
        <label class="block font-semibold text-gray-700">Project Description</label>
        <textarea v-model="projectDescription" class="w-full p-3 border rounded-lg shadow-sm h-32 focus:ring focus:ring-blue-300"></textarea>
      </div>
    </div>

    <!-- Project Duration -->
    <div class="mt-4 space-y-4">
      <label class="block font-semibold text-gray-700">Project Duration</label>
      <div>
        <p class="text-sm text-gray-600">Start Date</p>
        <input v-model="startDate" type="date" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
      </div>
      <div>
        <p class="text-sm text-gray-600">End Date</p>
        <input v-model="endDate" type="date" class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
      </div>
    </div>

    <!-- Team Section -->
    <div class="mt-4 space-y-4">
      <!-- Add Team Members -->
      <div>
        <label class="text-base font-semibold text-gray-700">Add Team Members</label>
        <input v-model="searchEmail" id="add-member" type="text" placeholder="Search email..." class="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-blue-300" />
        <ul v-if="searchEmail && !selectedEmail" class="bg-white border rounded-md mt-2 max-h-32 overflow-y-auto shadow-md">
          <li v-for="(email, index) in filteredEmails.slice(0, 10)" :key="index" @click="selectEmail(email)" class="p-2 cursor-pointer hover:bg-gray-100">
            {{ email }}
          </li>
        </ul>
      </div>

      <!-- Role Selection -->
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

      <!-- Team Members List -->
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
<hr class="w-full border-t-2 border-gray-300 my-4" />
<!-- Buttons -->
<div class="flex justify-center space-x-4 items-center">
  <button @click="addCreateProject" :disabled="isSubmitDisabled" class="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-blue-700">Save Change</button>
  <button @click="CancleCreateProject, goToListProject()" class="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md text-lg font-bold hover:bg-red-700">Cancel</button>
</div>
</div>

  
</template>


<style scoped>

</style>
