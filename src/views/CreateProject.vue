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
    <div class="flex justify-center items-center flex-grow pt-28">
  <div class="bg-gray-100 p-8 rounded-lg shadow-lg w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-4xl font-bold">Create Project</h2>
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
          <button @click="addCreateProject" :disabled="isSubmitDisabled" class="font-bold text-white px-6 py-3 rounded-xl text-xl" style="background-color: #316394;">Submit</button>
           <button @click="CancleCreateProject,goToListProject()" class="font-bold bg-red-700 text-white px-6 py-3 rounded-xl text-xl">Cancel</button>
        </div>
      </div>
    </div>
 
</template>

<style scoped>
input, textarea, select {
  border: 1px solid #d1d5db;
}
</style>