import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Login from '../views/Login.vue'
import Home from '../views/Home/index.vue'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { auth: true } },
  { path: '/login', name: 'login', component: Login }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const user = useUserStore()
  if (to.meta?.auth && !user.token) return '/login'
})

export default router