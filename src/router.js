import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/home.vue')
    },
    {
      path: '/browse/:recipe?',
      name: 'browse',
      component: () => import('./views/browse.vue')
    },
    {
      path: '/cook',
      name: 'cook',
      component: () => import('./views/cook.vue')
    },
    {
      path: '/how-it-works',
      name: 'how-it-works',
      component: () => import('./views/how-it-works.vue')
    },
    {
      path: '/admin/:recipe?',
      name: 'admin',
      component: () => import('./views/admin.vue')
    },
    {
      path: '*',
      name: 'not-found',
      component: () => import('./views/not-found.vue')
    }
  ]
});
