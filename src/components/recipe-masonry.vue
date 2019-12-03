<template>
  <div class="recipe-masonry">
    <div class="grid-layout">
      <div class="grid-item" v-bind:class="{'span-2': recipe.details.tags.indexOf('2x') >= 0, 'span-3': recipe.details.tags.indexOf('3x') >= 0}" v-for="(recipe, id) in recipes" v-bind:key="id" :style="recipe.details.imageStyle" @click="showRecipe(id)">
        <span class="name">{{recipe.details.name}}</span>
      </div>
    </div>
  </div>
</template>

<script>
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
      if(id !== this.recipe) this.$router.push({ name: 'recipe', params: { recipe: id }});
    }
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-gap: 1px;
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
