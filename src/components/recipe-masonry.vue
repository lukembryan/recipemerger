<template>
  <div class="recipe-masonry">
    <div class="grid-layout">
      <div class="grid-item" ref="recipes" v-bind:class="{'span-2': recipe.details.tags.indexOf('2x') >= 0, 'span-3': recipe.details.tags.indexOf('3x') >= 0}" v-for="(recipe, id) in recipes" v-bind:key="id" :style="recipe.details.imageStyle" @click="showRecipe(id)">
        <span class="name">{{recipe.details.name}}</span>
      </div>
    </div>
  </div>
</template>

<script>
import Velocity from 'velocity-animate';

export default {
  name: 'recipe-masonry',
  computed: {
    recipe: function(){
      return this.$store.state.recipe;
    },
    recipes: function(){
      return this.$store.state.recipes;
    }
  },
  methods: {
    showRecipe: function(id){
      var that = this;
      var recipes = this.$refs['recipes'];
      Velocity(recipes, { opacity: 0 }, { delay: 0, easing: 'easeInQuad' }, 150);
      setTimeout(function(){
        if(id !== that.recipe) that.$router.push({ name: 'recipe', params: { recipe: id }});
      }, 150);
    }
  },
  mounted: function(){
    var that = this;
    var checkForRecipes = setInterval(function(){
      var recipes = that.$refs['recipes'];
      if(recipes){
        Velocity(recipes, { opacity: 1 }, { delay: 0, easing: 'easeInQuad' }, 150);
        clearInterval(checkForRecipes);
      }
    }, 100);
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-auto-rows: minmax(180px, auto);
  grid-auto-flow: dense;
  overflow-x: hidden;
  > .grid-item {
    padding: 1rem;
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    color: #fff;
    background-color: #333;
    background-position: center center;
    background-size: cover;
    cursor: pointer;
    opacity: 0;
    &:nth-child(odd) {
      background-color: #424242;
    }
    &.span-2 {
      grid-column-end: span 2;
      grid-row-end: span 2;
    }
    &.span-3 {
      grid-column-end: span 3;
      grid-row-end: span 4;
    }
    &.span-2, &.span-3 {
      > .name {
        display: inline;
      }
    }
    > .name {
      display: table-caption;
      padding: 1px 5px;
      background-color: #00000070;
      text-transform: none;
      line-height: 1.2;
    }
  }
}
</style>
