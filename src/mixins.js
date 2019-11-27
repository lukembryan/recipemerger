const fb = require('./firebase.js');

export default {
  data: function () {
    return {}
  },
  computed: {},
  methods: {
    getImage: function(recipe, callback){
      if(!recipe.image) recipe.image = 'recipe-photos/placeholder.png';

      var ref = fb.storage.ref(recipe.image);

      ref.getDownloadURL().then(function(url){
        recipe.imageStyle = {'background-image': 'url(' + url + ')'};
        if(callback) callback(recipe.imageStyle);
      }).catch(function(error){
        console.log('getDownloadURL', error);
        recipe.imageStyle = {'background-image': 'none'};
      });
    },
    clone: function(original){
      var copy = JSON.stringify(original);
      return JSON.parse(copy);
    }
  }
};
