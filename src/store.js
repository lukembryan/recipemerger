import Vue from 'vue';
import Vuex from 'vuex';
import mixins from '@/mixins.js';

const fb = require('./firebase.js');

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: null,
    recipe: '',
    currentRecipe: null,
    recipes: null,
    page: '',
    scrolledDown: false,
    userMessage: {
      text: '',
      type: ''
    }
  },
  mutations: {
    setUser: function(state, user){
      state.user = user;
    },
    setRecipe: function(state, recipe){
      state.recipe = recipe;

      var recipesCheck = setInterval(function(){
        if(state.recipes){
          clearInterval(recipesCheck);
          state.currentRecipe = state.recipes[state.recipe];
        }
      }, 100);
    },
    setRecipes: function(state, recipes){
      state.recipes = recipes;
    },
    setPage: function(state, page){
      state.page = page;
    },
    setScrolledDown: function(state, scrolledDown){
      state.scrolledDown = scrolledDown;
    },
    setUserMessage: function(state, userMessage){
      state.userMessage = userMessage;
    }
  },
  actions: {
    initAuth: function({commit, dispatch}){
      fb.auth.onAuthStateChanged(function(user){
        if(user){
          user.getIdToken().then(function(accessToken){
            commit('setUser', {
              displayName: user.displayName,
              email: user.email,
              emailVerified: user.emailVerified,
              phoneNumber: user.phoneNumber,
              photoURL: user.photoURL,
              uid: user.uid,
              providerData: user.providerData,
              isAnonymous: user.isAnonymous,
              accessToken: accessToken
            });
            dispatch('loadRecipes');
          });
        }else{
          fb.auth.signInAnonymously().catch(function(error){
            console.log('signInAnonymously', error);
          });
        }
      });
    },
    recipeLoaded: function({commit}, recipe){
      commit('setRecipe', recipe);
    },
    routeChanged: function({commit}, pages){
      commit('setPage', pages[1]);
    },
    updateScroll: function({commit}, event){
      var scrolledDown = event.srcElement.scrollingElement.scrollTop > 50;
      commit('setScrolledDown', scrolledDown);
    },
    loadRecipes: function({commit}){
      var recipes = {};
      fb.recipes.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          recipes[doc.id] = doc.data();
          mixins.methods.getImage(recipes[doc.id]);
        });
        commit('setRecipes', recipes);
      }).catch(function(error) {
        console.log(error);
        commit('setUserMessage', { text: 'issue loading recipes', type: 'text-danger' });
      });
    },
    saveRecipe: function({state, commit}, component){
      commit('setUserMessage', { text: 'saving recipe', type: 'text-info' });
      var ref = fb.recipes.doc(state.recipe).update(component);
      if(state.recipe === 'add') ref = fb.recipes.doc().set(component);
      ref.then(function() {
        commit('setUserMessage', { text: 'recipe saved', type: 'text-success' });
      }).catch(function(error) {
        console.log(error);
        commit('setUserMessage', { text: 'issue saving recipe', type: 'text-danger' });
      });
    },
    deleteRecipe: function({state, commit}){
      fb.recipes.doc(state.recipe).delete().then(function() {
        commit('setUserMessage', { text: 'recipe deleted', type: 'text-success' });
      }).catch(function(error) {
        console.log(error);
        commit('setUserMessage', { text: 'issue deleting recipe', type: 'text-danger' });
      });
    }
  }
});
