<template>
  <div class="cook content" v-if="selectedRecipes[0]">
    <div class="step-control">
      <font-awesome-icon class="link" :icon="['fal', 'chevron-up']" v-if="currentStep > 0" @click="changeStep(-1);" />
      <div class="key-guide" v-if="currentStep > 0">
        <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> up
      </div>
      <span class="end-point" v-if="currentStep === 0">start</span>
    </div>
    <div class="current-step">{{selectedRecipes[0].steps[currentStep].description}}</div>
    <div class="step-control">
      <div class="key-guide" v-if="currentStep < selectedRecipes[0].steps.length - 1">
        <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> down
      </div>
      <font-awesome-icon class="link" :icon="['fal', 'chevron-down']" v-if="currentStep < selectedRecipes[0].steps.length - 1" @click="changeStep(1);" />
      <span class="link end-point" v-if="currentStep === selectedRecipes[0].steps.length - 1">finish</span>
    </div>
  </div>
</template>

<script>
import mixins from '@/mixins.js';

export default {
  name: 'cook',
  mixins: [mixins],
  components: {},
  data: function(){
    return {
      selectedRecipeIds: [],
      selectedRecipes: [],
      currentStep: 0
    };
  },
  computed: {},
  methods: {
    loadRecipes: function(){
      var selectedRecipes = [];
      var data = this;

      var recipesCheck = setInterval(function(){
        if(data.recipes){
          clearInterval(recipesCheck);

          for(var i=0; i < data.selectedRecipeIds.length; i++){
            var recipeInList = data.recipes[data.selectedRecipeIds[i]];
            if(recipeInList) selectedRecipes.push(recipeInList);
          }

          data.selectedRecipes = selectedRecipes;
        }
      }, 100);
    },
    changeStep: function(direction){
      if(this.currentStep == 0 && direction == -1) return;
      if(this.currentStep == this.selectedRecipes[0].steps.length-1 && direction == 1) return;
      this.currentStep += direction;
    },
    handleKeyPress: function(e){
      if(e.key == 'ArrowUp') this.changeStep(-1);
      if(e.key == 'ArrowDown') this.changeStep(1);
    }
  },
  watch: {
    selectedRecipeIds: function(selectedRecipeIds){
      if(selectedRecipeIds) this.loadRecipes();
    }
  },
  created: function(){
    var selectedRecipeIds = localStorage.getItem('selectedRecipes');
    if(selectedRecipeIds) selectedRecipeIds = JSON.parse(selectedRecipeIds);
    this.selectedRecipeIds = selectedRecipeIds;

    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeDestroy: function(){
    window.removeEventListener('keydown', this.handleKeyPress);
  }
}
</script>

<style scoped lang="less">
.cook {
  display: grid;
  grid-template-rows: 100px auto 100px;
  padding: 20px;
  text-align: center;
  align-items: center;
  .step-control {
    font-size: 5em;
    line-height: 1;
    > .key-guide {
      font-size: 0.2em;
    }
    > .end-point {
      font-size: 0.8em;
    }
  }
  .current-step {
    font-size: 2.5em;
    font-weight: 100;
    padding: 20px 5%;
  }
}
</style>
