<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import { getUserById } from "../composable/getJudProjects";

const router = useRouter();
const username = ref("");
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Add popup state and message refs
const popupMessage = ref('');
const showPopup = ref(false);
const successMessage = ref(''); // Added the missing successMessage ref

// Function to show error popup
const showPopupError = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

// Function to close popup
const closePopup = () => {
  showPopup.value = false;
  popupMessage.value = '';
};

onMounted(async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not found. Please log in.");
    }

    const userData = await getUserById(userId);
    console.log("User Data:", userData);

    username.value = userData.username;

  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
});

const updatePassword = async () => {
  try {
    const userId = localStorage.getItem("userId");

    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
      showPopupError("Please fill in all password fields.");
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      showPopupError("New password and confirmation do not match.");
      return;
    }

    // 🔒 Step 1: ตรวจสอบรหัสผ่านเก่า
    const checkResponse = await fetch(
      import.meta.env.VITE_ROOT_API + "/api/checkpassword",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.value,
          password: currentPassword.value,
        }),
      }
    );

    // Check if the response is okay
    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      throw new Error(errorText || "Current password is incorrect.");
    }

    // Safely parse the response if it's JSON
    const checkResponseData = await checkResponse.json();

    // ✅ Step 2: ส่งรหัสใหม่ไปอัปเดต
    const formData = new FormData();
    formData.append("password", newPassword.value);

    const updateResponse = await fetch(
      import.meta.env.VITE_ROOT_API + "/api/profile/update",
      {
        method: "PUT",
        headers: {
          Authorization: userId,
        },
        body: formData,
      }
    );

    // Check if the update response is okay
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(errorText || "Error updating password. Please try again.");
    }

    const result = await updateResponse.json();

    if (result && result.status === "Success") {
      successMessage.value = "Password updated successfully!";
      setTimeout(() => (successMessage.value = ""), 1000);
    } else {
      showPopupError(
        "Error updating password: " + (result.message || "Please try again.")
      );
    }
  } catch (error) {
    console.error("Password update error:", error.message);
    showPopupError("Error: " + error.message);
  }
};

const toggleCurrentPasswordVisibility = () => {
  showCurrentPassword.value = !showCurrentPassword.value;
};

const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

const changePassword = () => {
  console.log("Changing password...");
};

const cancelChange = () => {
  router.go(-1);
};
</script>


<template>
  <div class="min-h-screen from-indigo-100 bg-gray-50 flex flex-col">
    <NavBar />
    <div class="container mx-auto px-4 py-32">
      <div class="max-w-2xl mx-auto space-y-8">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-black mb-2">Change Password</h1>
        </div>
        <div class="bg-white rounded-lg shadow-md p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <div class="flex items-center space-x-3">
            <input
              type="text"
              class="flex-grow bg-gray-100 border-none rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              v-model="username"
            />
          </div>
        </div>
        <!-- Current Password Section  -->
        <div
          class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
        >
          <h2 class="text-xl font-semibold text-black mb-4">Current Password</h2>
          <div class="relative">
            <input
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter your current password"
            />
            <!-- Eye icon for current password -->
            <button
              type="button"
              @click="toggleCurrentPasswordVisibility"
              class="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <!-- Eye open when password is visible -->
              <svg
                v-if="showCurrentPassword"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <!-- Eye closed when password is hidden -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                />
              </svg>
            </button>
          </div>
        </div>
        <!-- New Password Section  -->
        <div
          class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
        >
          <h2 class="text-xl font-semibold text-black mb-4">New Password</h2>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter new password"
            />
            <!-- Eye icon for new password -->
            <button
              type="button"
              @click="toggleNewPasswordVisibility"
              class="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <!-- Eye open when password is visible -->
              <svg
                v-if="showNewPassword"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <!-- Eye closed when password is hidden -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password Section  -->
        <div
          class="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
        >
          <h2 class="text-xl font-semibold text-black mb-4">Confirm New Password</h2>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Confirm your new password"
            />
            <!-- Eye icon for confirm password -->
            <button
              type="button"
              @click="toggleConfirmPasswordVisibility"
              class="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <!-- Eye open when password is visible -->
              <svg
                v-if="showConfirmPassword"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <!-- Eye closed when password is hidden -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Action Buttons  -->
        <div class="flex justify-center space-x-4">
          <button
            @click="updatePassword"
            class="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all transform hover:scale-105"
          >
            Change Password
          </button>
          <button
            @click="cancelChange"
            class="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all transform hover:scale-105"
          >
            Cancel
          </button>
        </div>
      </div>
       <!-- Error Popup Modal -->
    <transition name="fade">
      <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="relative bg-white rounded-lg shadow-2xl px-8 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100">
          <!-- Header with color -->
          <div class="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-lg"></div>
          
          <!-- Icon and message -->
          <div class="mt-4 mb-2 flex flex-col items-center">
            <div class="bg-red-100 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="text-lg font-medium text-gray-800">{{ popupMessage }}</p>
          </div>
          
          <!-- Action button -->
          <button 
            @click="closePopup" 
            class="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </transition>
    </div>
  </div>
</template>

<style scoped></style>
