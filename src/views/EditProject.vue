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
   <!-- Form Section -->
    <div class="flex justify-center items-center flex-grow pt-28">
  <div class="bg-gray-100 p-8 rounded-lg shadow-lg w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-4xl font-bold">Update Project</h2>
      <img 
        src="../components/icon/MakiCross.png" 
        alt="Close" 
        class="h-8 w-8 cursor-pointer" 
        @click="$router.push('/projects')" 
      />
    </div>

    <!-- Form Inputs -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Project Name -->
      <div>
        <label class="block font-semibold">Project Name</label>
        <input v-model="projectName" type="text" class="w-full p-2 border rounded" />
      </div>

      <!-- Project Description -->
      <div class="row-span-3">
        <label class="block font-semibold">Project Description</label>
        <textarea v-model="projectDescription" class="w-full border rounded h-64"></textarea>
      </div>

      <!-- Project Duration -->
      <div>
        <label class="block font-semibold">Project Duration</label>
        <p class="mt-1">Start Date</p>
        <input v-model="startDate" type="date" class="w-full p-2 border rounded" />
        <p class="mt-2">End Date</p>
        <input v-model="endDate" type="date" class="w-full p-2 border rounded" />
      </div>
    </div>

    <!-- Team Section -->
    <div class="grid grid-cols-3 gap-4 mt-4">
      <!-- Add Team Members -->
      <div class="flex flex-col gap-2">
        <label class="text-base block mb-1">Add Team Members</label>
        <input v-model="searchEmail" id="add-member" type="text" placeholder="Search email..." class="input input-bordered w-full h-12" />
        <ul v-if="searchEmail && !selectedEmail" class="bg-white border border-gray-300 rounded-md mt-1 max-h-32 overflow-y-auto">
          <li v-for="(email, index) in filteredEmails.slice(0, 10)" :key="index" @click="selectEmail(email)" class="p-2 cursor-pointer hover:bg-gray-100">
            {{ email }}
          </li>
        </ul>
      </div>
<!-- Role Selection -->
<div class="flex flex-col gap-3">
  <label class="text-base font-semibold">Role</label>
  <div class="flex flex-row items-center gap-2">
    <select v-model="selectedRole" class="select select-bordered w-full">
      <option value="">- Select role -</option>
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
    <button @click="addMember" class="bg-green-600 text-white px-4 py-2 rounded font-bold whitespace-nowrap">Add</button>
  </div>
</div>



      <!-- Team Members List -->
      <div class="flex flex-col gap-2">
        <label class="text-base block mb-1">Team Members</label>
        <div class="w-full h-20 bg-white rounded-md p-2 overflow-y-auto">
          <ul>
            <li v-for="(member, index) in teamMembers" :key="index" class="mt-1 flex justify-between items-center p-1">
              <span class="truncate">{{ member.email }} ({{ member.role }})</span>
              <button @click="removeMember(index)" class="text-red-500 font-bold px-4">&times;</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
       <br>
        <hr>
        <!-- Buttons -->
        <div class="flex justify-center items-center space-x-6 mt-4  ">
          <button @click="addCreateProject" :disabled="isSubmitDisabled" class="font-bold text-white px-6 py-3 rounded-xl text-xl" style="background-color: #316394;">Update</button>
           <button @click="CancleCreateProject,goToListProject()" class="font-bold bg-red-700 text-white px-6 py-3 rounded-xl text-xl">Cancel</button>
        </div>
      </div>
    </div>
  

    
  
</template>


<style scoped>

</style>
