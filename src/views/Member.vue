<script setup>
import { RouterView } from "vue-router";
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { getAllUsers, getUserById } from "../composable/getJudProjects";
import { UserPlusIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();

const selectedProjectId = ref(null);
const selectedProjectMembers = ref(null);
const isAddMemberPopupOpen = ref(false);
const availableEmails = ref([]);
const searchEmail = ref("");
const selectedEmail = ref("");
const selectedRole = ref("");
const projectId = route.params.id;
const currentUserRole = ref("");

const getUserRole = async () => {
  try {
    // ดึงข้อมูลของผู้ใช้จาก API
    const userData = await getUserById(localStorage.getItem('userId')); // สมมุติว่ามี userId ใน localStorage

    if (!userData || !userData.username) {
      console.error("User data not found");
      return;
    }

    // เปรียบเทียบ username ที่ได้จาก API กับสมาชิกในโปรเจ็กต์
    const currentUser = selectedProjectMembers.value.find(
      (member) => member.username === userData.username
    );

    if (currentUser) {
      currentUserRole.value = currentUser.role;
      return currentUser.role;
    } else {
      console.error("User is not a member of this project.");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};

onMounted(async () => {
  fetchUsers();
  if (projectId) {
    await viewProjectMember(projectId);
    const role = await getUserRole();
    console.log("Current user's role:", role);
  } else {
    console.error("No projectId found in route");
  }
});
const image = ref(null);

const membersImage = ref([]);
const fetchMemberPicture = async (memberId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_ROOT_API}/api/project/member/${memberId}/picture`,
      {
        method: "GET",
        headers: { "Authorization": token, "Content-Type": "application/json" },
      }
    );

    console.log("Response Status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch picture, status: ${response.status}`);
    }

    const imageBlob = await response.blob();
    return imageBlob ? URL.createObjectURL(imageBlob) : null;
  } catch (error) {
    console.error("Failed to fetch member picture:", error);

    // กำหนดรูป Default ถ้าโหลดไม่สำเร็จ
    membersImage.value.push = "/images/default-profile.png";
  }
};

const fetchUsers = async () => {
  const response = await getAllUsers();
  if (response) {
    availableEmails.value = response.users.map((user) => user.email);
  }
};

const viewProjectMember = async (projectId) => {
  try {
    const token = localStorage.getItem('token');
    console.log("Fetching members for project ID:", projectId);

    selectedProjectId.value = projectId;

    const response = await fetch(
      import.meta.env.VITE_ROOT_API + `/api/project/${projectId}/members`,
      {
        method: "GET",
        headers: {"Authorization": token, "Content-Type": "application/json" },
      }
    );
    const result = await response.json();

    console.log("API Response:", result);

    if (result && result.status === "Success") {
      // Fetch รูปของสมาชิกแต่ละคน
      const membersWithImages = await Promise.all(
        result.members.map(async (member) => {
          const imageURL = await fetchMemberPicture(member.memberId);
          return { ...member, image: imageURL || "/images/default-profile.png" };
        })
      );

      selectedProjectMembers.value = membersWithImages;
    } else {
      console.error("Error fetching project members:", result.message);
    }
  } catch (error) {
    console.error("Error fetching project members:", error.message);
  }
};

// Add member to project
const addMemberToProject = async (email, role) => {
  if (!selectedProjectId.value) {
    console.error("No project selected for adding members");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_ROOT_API +
        `/api/project/${selectedProjectId.value}/add-member`,
      {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      }
    );

    const result = await response.json();

    if (result && result.status === "Success") {
      console.log("Member added successfully:", result);
      // Refresh member list
      await viewProjectMember(selectedProjectId.value);
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Error adding member:", error.message);
  }
};

//update member
const updateRoleForMember = async (memberId, newRole) => {
  console.log("Member ID:", memberId); // ตรวจสอบค่าของ memberId ที่ส่งไป
  if (!memberId) {
    console.error("Member ID is null or undefined!");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      import.meta.env.VITE_ROOT_API +
        `/api/project/${selectedProjectId.value}/member/update`,
      {
        method: "PUT",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId, role: newRole }),
      }
    );

    const result = await response.json();

    if (result && result.status === "Success") {
      console.log("Role updated successfully:", result);
      // Refresh member list to reflect the role update
      await viewProjectMember(selectedProjectId.value);
    } else {
      alert(result.message || "Failed to update role");
    }
  } catch (error) {
    console.error("Error updating role:", error.message);
  }
};

// delete member
const removeMemberFromProject = async (memberId) => {
  if (!selectedProjectId.value) {
    console.error("No project selected for removing members");
    return;
  }
  if (!confirm("Are you sure you want to remove this member?")) {
    return; // If the user selects Cancel, exit the function
  }
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("No token found for authorization");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_ROOT_API}/api/project/${selectedProjectId.value}/member/remove`,
      {
        method: "DELETE",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          members: [memberId],
        }),
      }
    );

    const result = await response.json();

    if (result && result.status === "Success") {
      console.log("Member removed successfully:", result);
      await viewProjectMember(selectedProjectId.value);
    } else {
      console.error("Error removing member:", result.message);
    }
  } catch (error) {
    console.error("Error removing member:", error.message);
  }
};

// Popup management
const openAddMemberPopup = () => {
  isAddMemberPopupOpen.value = true;
};

const closeAddMemberPopup = () => {
  isAddMemberPopupOpen.value = false;
  searchEmail.value = "";
  selectedEmail.value = "";
};

// Computed property for filtering emails
const filteredEmails = computed(() => {
  return availableEmails.value.filter((email) => email.includes(searchEmail.value));
});

// Select email from autocomplete
const selectEmail = (email) => {
  searchEmail.value = email;
  selectedEmail.value = email;
};

// Add member action
const addMember = () => {
  if (searchEmail.value && selectedRole.value) {
    addMemberToProject(searchEmail.value, selectedRole.value);
    searchEmail.value = "";
    selectedRole.value = "";
    closeAddMemberPopup();
  } else {
    console.error("Please select an email and role");
  }
};

const getMemberInitials = (name) => {
  if (!name || name.length < 2) return name || "U";

  return (name[0] + name[name.length - 1]).toUpperCase();
};
</script>

<template>
  <div class="min-h-screen from-indigo-100 bg-gray-50 flex flex-col">
    <NavBar />

    <!-- Members Section -->
    <div v-if="selectedProjectMembers" class="container mx-auto px-20 py-32">
      <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-[#316394] text-white px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold">Project Members</h2>
          <button
            class="btn btn-outline btn-sm text-white hover:bg-white hover:text-indigo-600 transition-colors"
            @click="openAddMemberPopup"
          >
            <UserPlusIcon class="h-5 w-5 mr-2" />
              Invite Members
          </button>
        </div>

        <!-- Member List -->
        <div class="p-6">
          <div v-if="selectedProjectMembers.length" class="space-y-4">
            <div
              v-for="member in selectedProjectMembers"
              :key="member.id"
              class="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-indigo-200"
                >
                  <img
                    v-if="member.image"
                    :src="member.image"
                    alt="Profile"
                    class="w-full h-full object-cover"
                    @error="member.image = null"
                  />
                  <span v-else class="text-indigo-800">
                    {{ getMemberInitials(member.username) }}
                  </span>
                </div>

                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold text-gray-800">{{ member.username }}</span>
                    <span
                      class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full"
                    >
                      {{ member.role }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">{{ member.email }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div v-if="(currentUserRole === 'Owner' && member.role !== 'Owner') ||
                         (currentUserRole !== 'member' && currentUserRole !== 'Owner' && member.role === 'member')" class="flex items-center space-x-2">
                  <select
                    v-model="member.role"
                    @change="updateRoleForMember(member.memberId, member.role)"
                    class="bg-white text-gray-800 border border-gray-300 px-2 py-1 rounded-md"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  v-if="(currentUserRole === 'Owner' && member.role !== 'Owner') ||
                        (currentUserRole !== 'member' && currentUserRole !== 'Owner' && member.role === 'member')"
                  @click="removeMemberFromProject(member.memberId)"
                  class="group relative flex items-center justify-center w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 transition-all duration-300 ease-in-out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-red-600 group-hover:text-red-800 transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span
                    class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    Remove
                  </span>
                </button>
              </div>


            </div>
          </div>

          <!-- No Members Message -->
          <div v-else class="text-center py-10">
            <div class="text-xl text-gray-400">No Members Available</div>
          </div>
        </div>
      </div>

      <!-- Add Member Popup -->
      <div
        v-if="isAddMemberPopupOpen"
        class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4"
      >
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Invite to Project</h2>

          <div class="space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                v-model="searchEmail"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search email..."
              />
              <ul
                v-if="searchEmail && !selectedEmail"
                class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg"
              >
                <li
                  v-for="email in filteredEmails.slice(0, 10)"
                  :key="email"
                  @click="selectEmail(email)"
                  class="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {{ email }}
                </li>
              </ul>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                v-model="selectedRole"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select role</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button class="btn btn-ghost text-gray-600" @click="closeAddMemberPopup">
                Cancel
              </button>
              <button
                class="btn btn-primary bg-indigo-600 hover:bg-indigo-700"
                @click="addMember"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
