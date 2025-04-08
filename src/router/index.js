import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import DashboardListProjects from '../views/DashboardListProjects.vue'
import ListProjects from '../views/ListProjects.vue'
// import TaskBoardVue from '@/views/TaskBoard.vue'
import CreateProjectVue from '@/views/CreateProject.vue'
import LoginVue from '../views/Login.vue'
import SignUpVue from '@/views/SignUp.vue'
import Taskboard from '../views/Taskboard.vue'
import TeamPlanVue from '../views/TeamPlan.vue'
import EditProjectVue from '../views/EditProject.vue'
import ProfileVue from  '@/views/Profile.vue'
import TestVue from '../views/Test.vue'
import MemberVue from '../views/Member.vue'
import ChangePasswordVue from '../views/ChangePassword.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePage
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardListProjects
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginVue
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUpVue
    },
    {
      path: '/projects',
      name: 'Listprojects',
      component: ListProjects
    },
    {
      path: '/create',
      name: 'CreateProject',
      component: CreateProjectVue
     },
    {
      path: '/project/board-:id',
      name: 'Taskboard',
      component: Taskboard
    },
    {
      path: '/project/teamplan/:id',
      name: 'TeamPlan',
      component: TeamPlanVue
    },
    {
      path: '/edit/:id',
      name: 'EditProject',
      component: EditProjectVue
    },
    {
    path: '/test',
    name: 'Test',
    component: TestVue
    },
    {
      path: '/profile',
      name: 'Profile',
      component: ProfileVue
     },
     {
      path: '/password',
      name: 'Password',
      component: ChangePasswordVue
     },
     {
      path: '/member/:id',
      name: 'Member',
      component: MemberVue
     }
  ]
})

router.beforeEach((to, from, next) => {
  const publicPages = ['HomePage','Login', 'SignUp']; 
  const isPublicPage = publicPages.includes(to.name);
  const token = localStorage.getItem('token');
  const lastLogin = localStorage.getItem('lastLogin');
  const EXPIRATION_TIME = 30 * 60 * 1000; // 30 นาที
  // const EXPIRATION_TIME = 3000;

  if (token && lastLogin) {
    const currentTime = Date.now();
    if (currentTime - lastLogin > EXPIRATION_TIME) {
      // ถ้าเกิน 30 นาที ให้ลบ token แล้ว redirect ไปหน้า login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('lastLogin');
      return next({ name: 'Login' });
    } else {
      // อัปเดตเวลาใหม่เมื่อยังอยู่ในช่วงเวลาที่กำหนด
      localStorage.setItem('lastLogin', Date.now());
    }
  }
  if (to.name === 'HomePage' && token) {
    return next({ name: 'Dashboard' });
  }

  if (!isPublicPage && !token) {
    next({ name: 'Login' });
  } else {
    next();
  }
});


export default router
