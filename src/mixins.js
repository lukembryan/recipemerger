const fb = require('./firebase.js');

export default {
  data: function () {
    return {}
  },
  computed: {
    page: function(){
      return this.$store.state.page;
    },
    recipes: function(){
      return this.$store.state.recipes;
    },
    recipe: function(){
      return this.$store.state.recipe;
    }
  },
  methods: {
    getImage: function(recipe, callback){
      if(!recipe.details.image) recipe.details.image = 'recipe-photos/placeholder.png';

      var ref = fb.storage.ref(recipe.details.image);

      ref.getDownloadURL().then(function(url){
        recipe.details.imageStyle = {'background-image': 'url(' + url + ')'};
        if(callback) callback(recipe.details.imageStyle);
      }).catch(function(error){
        console.log('getDownloadURL', error);
        recipe.details.imageStyle = {'background-image': 'none'};
      });
    },
    clone: function(original){
      var copy = JSON.stringify(original);
      return JSON.parse(copy);
    }
  }
};
