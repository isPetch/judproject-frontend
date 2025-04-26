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

// Password strength indicator
const passwordStrength = computed(() => {
  if (!newPassword.value) return { strength: 0, text: "", color: "bg-gray-200" };
  
  const hasLowerCase = /[a-z]/.test(newPassword.value);
  const hasUpperCase = /[A-Z]/.test(newPassword.value);
  const hasNumbers = /\d/.test(newPassword.value);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value);
  const length = newPassword.value.length;
  
  let strength = 0;
  if (length >= 8) strength += 1;
  if (hasLowerCase) strength += 1;
  if (hasUpperCase) strength += 1;
  if (hasNumbers) strength += 1;
  if (hasSpecialChars) strength += 1;
  
  let text = "";
  let color = "";
  
  if (strength === 0 || length < 6) {
    text = "Too weak";
    color = "bg-red-500";
  } else if (strength === 1 || strength === 2) {
    text = "Weak";
    color = "bg-orange-500";
  } else if (strength === 3) {
    text = "Medium";
    color = "bg-yellow-500";
  } else if (strength === 4) {
    text = "Strong";
    color = "bg-green-500";
  } else {
    text = "Very strong";
    color = "bg-green-600";
  }
  
  return { strength, text, color, percent: Math.min(100, strength * 20) };
});

// Validation indicators
const passwordsMatch = computed(() => {
  if (!confirmPassword.value || !newPassword.value) return null;
  return newPassword.value === confirmPassword.value;
});

// Animation states
const isChangingPassword = ref(false);

// Popup states
const popupMessage = ref("");
const showPopup = ref(false);
const successPopupMessage = ref("");
const showSuccessPopup = ref(false);

// Function to show error popup
const showPopupError = (message) => {
  popupMessage.value = message;
  showPopup.value = true;
};

// Function to close popup
const closePopup = () => {
  showPopup.value = false;
  popupMessage.value = "";
};

// Function to show success popup
const showSuccessMessage = (message) => {
  successPopupMessage.value = message;
  showSuccessPopup.value = true;
};

// Function to close success popup
const closeSuccessPopup = () => {
  showSuccessPopup.value = false;
  successPopupMessage.value = "";
  // Redirect after successful password change
  router.go(-1);
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
    showPopupError("Failed to load user data. Please try again later.");
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
    
    if (passwordStrength.value.strength < 3) {
      showPopupError("Please choose a stronger password for better security.");
      return;
    }

    isChangingPassword.value = true;

    // Step 1: ตรวจสอบรหัสผ่านเก่า
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
    let checkResponseData = {};
    const checkResponseText = await checkResponse.text();
    if (checkResponseText) {
      try {
        checkResponseData = JSON.parse(checkResponseText);
      } catch (e) {
        console.log("Response is not JSON:", checkResponseText);
      }
    }

    // Step 2: ส่งรหัสใหม่ไปอัปเดต
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

    const resultText = await updateResponse.text();
    let result = {};
    if (resultText) {
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        console.log("Response is not JSON:", resultText);
      }
    }

    if (result && result.status === "Success") {
      // Show the success popup
      showSuccessMessage("Password updated successfully!");
      
      // Reset password fields
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
    } else {
      showPopupError(
        "Error updating password: " + (result.message || "Please try again.")
      );
    }
  } catch (error) {
    console.error("Password update error:", error.message);
    showPopupError("Error: " + error.message);
  } finally {
    isChangingPassword.value = false;
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

const cancelChange = () => {
  router.go(-1);
};

// Validation for password input
const passwordTips = [
  { text: "At least 8 characters", check: () => newPassword.value.length >= 8 },
  { text: "Contains uppercase letter", check: () => /[A-Z]/.test(newPassword.value) },
  { text: "Contains lowercase letter", check: () => /[a-z]/.test(newPassword.value) },
  { text: "Contains number", check: () => /\d/.test(newPassword.value) },
  { text: "Contains special character", check: () => /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value) }
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
    <NavBar />
    <div class="container mx-auto px-4 py-12 sm:py-16 md:py-24">
      <div class="max-w-lg mx-auto space-y-6 bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
          <p class="text-gray-600">Update your password to keep your account secure</p>
        </div>
        
        <!-- Form Container -->
        <form class="space-y-6" @submit.prevent="updatePassword">
          <!-- Username -->
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div class="flex items-center">
              <div class="flex-grow bg-white text-gray-800 border rounded-md py-2 px-3">
                {{ username }}
              </div>
            </div>
          </div>
          
          <!-- Current Password -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Current Password</label>
            <div class="relative">
              <input
                v-model="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter your current password"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="toggleCurrentPasswordVisibility"
                class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
              >
                <svg v-if="showCurrentPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- New Password -->
          <div class="space-y-1 pt-2">
            <label class="block text-sm font-medium text-gray-700">New Password</label>
            <div class="relative">
              <input
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Enter new password"
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="toggleNewPasswordVisibility"
                class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
              >
                <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
            
            <!-- Password strength indicator -->
            <div v-if="newPassword" class="mt-2">
              <div class="flex justify-between items-center text-xs mb-1">
                <span>Password strength:</span>
                <span :class="`font-medium ${
                  passwordStrength.text === 'Too weak' || passwordStrength.text === 'Weak' 
                    ? 'text-red-600' 
                    : passwordStrength.text === 'Medium' 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`">{{ passwordStrength.text }}</span>
              </div>
              <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-300 ease-out rounded-full" 
                  :class="passwordStrength.color"
                  :style="`width: ${passwordStrength.percent}%`"
                ></div>
              </div>
              
              <!-- Password requirements -->
              <div class="mt-3 space-y-1.5">
                <div v-for="(tip, index) in passwordTips" :key="index" class="flex items-center text-xs">
                  <svg v-if="tip.check()" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span :class="tip.check() ? 'text-green-700' : 'text-gray-500'">{{ tip.text }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Confirm Password -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                :class="{'border-red-500': passwordsMatch === false, 'border-green-500': passwordsMatch === true}"
                placeholder="Confirm your new password"
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="toggleConfirmPasswordVisibility"
                class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
              >
                <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
              
              <!-- Password match indicator -->
              <div v-if="passwordsMatch !== null" class="absolute right-12 top-1/2 transform -translate-y-1/2">
                <svg v-if="passwordsMatch" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p v-if="passwordsMatch === false" class="text-xs text-red-500 mt-1">Passwords don't match</p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <button
              type="button"
              @click="cancelChange"
              class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-all focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative overflow-hidden"
              :disabled="isChangingPassword"
            >
              <span v-if="!isChangingPassword">Change Password</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Error Popup Modal -->
    <transition name="fade">
      <div
        v-if="showPopup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div
          class="relative bg-white rounded-lg shadow-2xl px-6 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100"
        >
          <!-- Header with color -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-lg"></div>

          <!-- Icon and message -->
          <div class="mt-4 mb-2 flex flex-col items-center">
            <div class="bg-red-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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

    <!-- Success Popup Modal -->
    <transition name="fade">
      <div
        v-if="showSuccessPopup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div
          class="relative bg-white rounded-lg shadow-2xl px-6 py-6 text-center max-w-md w-full transform transition-all duration-300 scale-100"
        >
          <!-- Header with color -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-lg"></div>

          <!-- Icon and message -->
          <div class="mt-4 mb-2 flex flex-col items-center">
            <div class="bg-green-100 p-3 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p class="text-lg font-medium text-gray-800">{{ successPopupMessage }}</p>
          </div>

          <!-- Action button -->
          <button
            @click="closeSuccessPopup"
            class="mt-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>