import { createRouter, createWebHistory } from 'vue-router'

import AppLayout from '../layouts/AppLayout.vue'
import LoginView from '../views/auth/LoginView.vue'
import DashboardView from '../views/dashboard/DashboardView.vue'
import CustomersView from '../views/customers/CustomersView.vue'
import ProductsView from '../views/products/ProductsView.vue'
import OrdersView from '../views/orders/OrdersView.vue'
import OrderDetailsView from '../views/orders/OrderDetailsView.vue'
import AiProcessingView from '../views/ai/AiProcessingView.vue'
import ChatbotView from '../views/chatbot/ChatbotView.vue'

import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
        title: 'Prijava',
      },
    },
    {
      path: '/',
      component: AppLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            title: 'Dashboard',
          },
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersView,
          meta: {
            title: 'Narudžbe',
          },
        },
        {
          path: 'orders/:id',
          name: 'order-details',
          component: OrderDetailsView,
          meta: {
            title: 'Detalji narudžbe',
          },
        },
        {
          path: 'ai-processing',
          name: 'ai-processing',
          component: AiProcessingView,
          meta: {
            title: 'AI obrada PDF-a',
          },
        },
        {
          path: 'customers',
          name: 'customers',
          component: CustomersView,
          meta: {
            title: 'Kupci',
          },
        },
        {
          path: 'products',
          name: 'products',
          component: ProductsView,
          meta: {
            title: 'Proizvodi',
          },
        },
        {
          path: 'chatbot',
          name: 'chatbot',
          component: ChatbotView,
          meta: {
            title: 'AI chatbot',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return {
      name: 'dashboard',
    }
  }
})

export default router
