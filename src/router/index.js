import { createRouter, createWebHistory } from 'vue-router'
import DashboardListProjects from '../views/DashboardListProjects.vue'
import ListProjects from '../views/ListProjects.vue'
// import TaskBoardVue from '@/views/TaskBoard.vue'
// import CreateProjectVue from '@/views/CreateProject.vue'
import LoginVue from '../views/Login.vue'
import SignUpVue from '@/views/SignUp.vue'
// import ProfileVue from  '@/views/Profile.vue'
// import ChangePasswordVue from '@/views/ChangePassword.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
    // {
    //   path: '/create',
    //   name: 'CreateProject',
    //   component: CreateProjectVue
    // },
    // {
    //   path: '/login',
    //   name: 'Login',
    //   component: LoginVue
    // },
    // {
    //   path: '/signup',
    //   name: 'SignUp',
    //   component: SignUpVue
    // },
    // {
    //   path: '/profile',
    //   name: 'Profile',
    //   component: ProfileVue
    // },
    // {
    //   path: '/password',
    //   name: 'Password',
    //   component: ChangePasswordVue
    // },
    // {
    //   path: '/sprint/:id',
    //   name: 'Taskboard',
    //   component: TaskBoardVue,
    // }
  ]
})



export default router
