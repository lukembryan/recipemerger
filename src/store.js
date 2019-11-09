import Vue from 'vue';
import Vuex from 'vuex';

const fb = require('./firebase.js');

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: null,
    recipe: '',
    recipes: null,
    page: '',
    scrolledDown: false
  },
  mutations: {
    setUser: function(state, user){
      state.user = user;
    },
    setRecipe: function(state, recipe){
      state.recipe = recipe;
    },
    setRecipes: function(state, recipes){
      state.recipes = recipes;
    },
    setPage: function(state, page){
      state.page = page;
    },
    setScrolledDown: function(state, scrolledDown){
      state.scrolledDown = scrolledDown;
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
            var errorCode = error.code;
            var errorMessage = error.message;
          });
        }
      });
    },
    recipeLoaded: function({commit}, recipe){
      commit('setRecipe', recipe);
    },
    routeChanged: function({commit}, page){
      commit('setPage', page);
    },
    updateScroll: function({commit}, event){
      var scrolledDown = event.srcElement.scrollingElement.scrollTop > 50;
      commit('setScrolledDown', scrolledDown);
    },
    loadRecipes: function({commit, dispatch}){
      var recipes = {};
      fb.recipes.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          recipes[doc.id] = doc.data();
          getImage(recipes[doc.id]);
        });
        commit('setRecipes', recipes);
      }).catch(function(error) {
        console.log('Error getting documents: ', error);
      });

      function getImage(recipe){
        if(!recipe.image) recipe.image = 'recipe-photos/placeholder.png';

        var ref = fb.storage.ref(recipe.image);

        ref.getDownloadURL().then(function(url){
          recipe.imageStyle = {'background-image': 'url(' + url + ')'};
        }).catch(function(error){
          switch(error.code){
            case 'storage/object_not_found':
              // File doesn't exist
              break;
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;
            case 'storage/unknown':
              // Unknown error occurred, inspect the server response
              break;
          }
          recipe.imageStyle = {'background-image': 'none'};
        });
      }
    }
  }
});
