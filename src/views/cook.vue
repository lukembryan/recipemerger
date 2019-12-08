<template>
  <div class="cook content" v-if="selectedRecipes[0]">
    <div class="info method-progress">
      <div>Showing step</div>
      <div>{{currentStep+1}} of {{selectedRecipes[0].steps.length}}</div>
    </div>
    <div class="info step-estimate">
      <div>Should take</div>
      <div>~{{selectedRecipes[0].steps[currentStep].duration}} {{selectedRecipes[0].steps[currentStep].duration == 1 ? 'minute' : 'minutes'}}</div>
    </div>
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
    <div class="ingredients-used" v-bind:class="{'shown': showIngredients}" @click="toggleIngredients()">
      <div class="ingredients-panel">
        <span class="tab" v-bind:class="{'link': selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0, 'shown': showIngredients}" @click="toggleIngredients($event)">
          <span v-if="selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0">
            <font-awesome-icon :icon="['fal', {true: 'arrow-down', false: 'arrow-up'}[showIngredients]]" @click="changeStep(-1);" /> ingredients
          </span>
          <span v-if="selectedRecipes[0].steps[currentStep].ingredientsUsed.length === 0">no ingredients</span>
        </span>
        <div class="ingredients" v-show="showIngredients">
          <div class="ingredient" v-for="(ingredient, index) in selectedRecipes[0].steps[currentStep].ingredientsUsed">
            <div>{{ingredient.quantity}} {{findIngredient(ingredient, selectedRecipes[0]).unit}}</div>
            <div>{{findIngredient(ingredient, selectedRecipes[0]).description}}</div>
          </div>
        </div>
      </div>
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
      currentStep: 0,
      showIngredients: false
    };
  },
  computed: {
    selectedRecipes: function(){
      return this.$store.state.selectedRecipes;
    }
  },
  methods: {
    changeStep: function(direction){
      if(this.currentStep == 0 && direction == -1) return;
      if(this.currentStep == this.selectedRecipes[0].steps.length-1 && direction == 1) return;
      this.currentStep += direction;
      this.showIngredients = false;
    },
    toggleIngredients: function(e){
      if(e) e.stopPropagation();
      if(this.selectedRecipes[0].steps[this.currentStep].ingredientsUsed.length > 0) this.showIngredients = !this.showIngredients;
    },
    handleKeyPress: function(e){
      if(e.key == 'ArrowUp') this.changeStep(-1);
      if(e.key == 'ArrowDown') this.changeStep(1);
    }
  },
  created: function(){
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeDestroy: function(){
    window.removeEventListener('keydown', this.handleKeyPress);
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.cook {
  position: relative;
  display: grid;
  grid-template-rows: 100px auto 100px;
  padding: 20px;
  text-align: center;
  align-items: center;
  .info {
    position: absolute;
    top: 20px;
    font-size: 1em;
    font-weight: 100;
    &.method-progress {
      left: 20px;
      text-align: left;
    }
    &.step-estimate {
      right: 20px;
      text-align: right;
    }
    div:nth-child(2){
      font-size: 1.4em;
      font-weight: 100;
      line-height: 1;
    }
  }
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
  .ingredients-used {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
    z-index: 1;
    &.shown {
      top: 0;
      background-color: #00000066;
      cursor: pointer;
      .ingredients-panel {
        right: 0;
      }
    }
    .ingredients-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: auto;
      > .tab {
        display: inline-block;
        margin-left: 20px;
        font-size: 1.2em;
        padding: 20px 0;
        &.shown {
          padding: 10px 0;
          color: lighten(@brown, 30%);
        }
        svg {
          margin-right: 10px;
        }
      }
      > .ingredients {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-gap: 20px;
        background-color: #fff;
        padding: 20px;
        text-align: center;
        cursor: default;
        > .ingredient {
          display: inline-block;
          height: 100%;
          border: 1px solid #ccc;
          > div {
            &:nth-child(1){
              padding: 10px;
              background-color: #ccc;
              font-weight: 700;
            }
            &:nth-child(2){
              padding: 10px;
              font-size: 1.2em;
            }
          }
        }
      }
    }
  }
}
</style>
