<script setup>
import { ref, onMounted, computed, watch } from 'vue'; 
import { getAllProjects } from "../composable/getJudProjects";
import { getAllUsers } from '../composable/getJudProjects'
import { useRouter } from 'vue-router';



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
  return !projectName.value.trim() || !projectDescription.value.trim();
});

const addCreateProject = async () => {
  if (!isSubmitDisabled.value) {
    const projectData = {
      name: projectName.value,
      description: projectDescription.value,
      ...(startDate.value && { startDate: new Date(startDate.value).toISOString() }),
      ...(endDate.value && { dueDate: new Date(endDate.value).toISOString() }),
      ...(teamMembers.value.length > 0 && { member: teamMembers.value }) // เพิ่ม teamMembers
    };

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

// ค้นหา email ที่ตรงกับสิ่งที่พิมพ์
const filteredEmails = computed(() => {
  return availableEmails.value.filter(email => 
    email.toLowerCase().includes(searchEmail.value.trim().toLowerCase())
  );
});
const selectEmail = (email) => {
  searchEmail.value = email;
  selectedEmail.value = email;
  fetchUsers(); // โหลดอีเมลใหม่
};
watch(searchEmail, () => {
  selectedEmail.value = '';
});
watch(teamMembers, () => {
  fetchUsers();
});

// ดึงข้อมูลผู้ใช้จาก API
const fetchUsers = async () => {
  const response = await getAllUsers();
  if (response && response.status === "Success") {
  availableEmails.value = response.users.map(user => user.email);
}
};

// โหลดข้อมูลเมื่อหน้าเว็บโหลด
onMounted(() => {
  fetchUsers();
});

// เพิ่มสมาชิกเข้า Team Members
const addMember = () => {
  if (searchEmail.value && selectedRole.value) {
    teamMembers.value.push({ email: searchEmail.value, role: selectedRole.value });
    searchEmail.value = ''; // เคลียร์ช่อง input
    selectedRole.value = ''; // รีเซ็ต role
  }
};

// ลบสมาชิกออกจาก Team Members
const removeMember = (index) => {
  teamMembers.value.splice(index, 1);
};

const tabs = [
  { name: "Dashboard", link: "/" },
  { name: "Projects", link: "/projects" },
];

</script>
<template>
 <nav class="fixed top-0 left-0 w-full z-50 text-white p-4 flex justify-between items-center" style="background-color: #316394;">
    <div class="flex flex-row space-x-6 items-center">
      <div class="flex items-center space-x-2">
        <img src="../components/image/jubproject.png" alt="JudProject Logo" class="h-6 w-6" />
        <span class="text-lg font-bold">JudProject</span>
      </div>

      <div class="text-sm flex space-x-6">
        <router-link
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.link"
          class="px-4 py-2 relative transition duration-300 hover:text-white after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-blue-400 after:to-gray-200 after:scale-x-0 hover:after:scale-x-90 after:transition-transform after:duration-300"
        >
          {{ tab.name }}
        </router-link>
      </div>
    </div>
    </nav>

   <!-- Form Section -->
    <div class="flex justify-center items-center  flex-grow  pt-28">
      <div class=" bg-gray-100 p-16 rounded-lg shadow-lg w-11/12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-4xl font-bold">Create Project</h2>
          <img src="../components/icon/cross.png" alt="JudProject Logo" class="h-8 w-8" />
        </div>
        
        <!-- Form Inputs -->
        <div class="grid grid-cols-2 gap-2">
          <div class="mr-2">
            <label class="block font-semibold">Project Name</label>
            <input v-model="projectName" type="text" class="w-4/6 w-full p-2 border rounded" />
          </div>
          <div class="row-span-3">
            <label class="block font-semibold">Project Description</label>
            <textarea v-model="projectDescription" class="w-full  border rounded h-64"></textarea>
          </div>
          <div>
            <label class="block font-semibold">Project Duration</label>
            <br>
            <p>Start Date</p>
            <div class="flex space-x-2">
              <input v-model="startDate" type="date" class="w-4/6 p-2 border rounded" />
            </div>
            <br>
             <p>End Date</p>
            <div class="flex space-x-2">
              <input v-model="endDate" type="date" class="w-4/6 p-2 border rounded" />
            </div>
          </div>
          
          <!-- Team Members Section -->
          <div class="col-span-2 mt-4">
            <label class="block font-semibold">Add Team Members</label>
            <div class="flex space-x-4">
              <input v-model="searchEmail" type="text" placeholder="Search email..." class="p-2 border rounded w-1/3" />
              <select v-model="selectedRole" class="p-2 border rounded w-1/4">
                <option value="">- Select role -</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button @click="addMember" class="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
            </div>
            
              <ul>
                <li v-for="(member, index) in teamMembers" :key="index" class="flex justify-between p-1">
                  <span>{{ member.email }} ({{ member.role }})</span>
                  <button @click="removeMember(index)" class="text-red-500">&times;</button>
                </li>
              </ul>
            </div>
          </div>
       <br>
        <hr>
        <!-- Buttons -->
        <div class="flex justify-center items-center space-x-2 mt-4  ">
          <button @click="addCreateProject" :disabled="isSubmitDisabled" class=" text-white px-4 py-2 rounded " style="background-color: #316394;" >Submit</button>
           <button @click="CancleCreateProject,goToListProject()" class="bg-red-700 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
 
</template>

<style scoped>
input, textarea, select {
  border: 1px solid #d1d5db;
}
</style>