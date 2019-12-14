<template>
  <div class="cook content" v-if="selectedRecipes[0]">
    <router-link :to="{ name: 'recipe', params: {recipe: selectedRecipeIds[0]}}" class="back-to-recipe link">
      <font-awesome-icon :icon="['fal', 'chevron-left']" /> back to recipe
    </router-link>
    <div class="info method-progress">
      <div>Showing step</div>
      <div>{{currentStep+1}} of {{selectedRecipes[0].steps.length}}</div>
    </div>
    <div class="info step-estimate">
      <div>Should take</div>
      <div>~ {{selectedRecipes[0].steps[currentStep].duration}} {{selectedRecipes[0].steps[currentStep].duration == 1 ? 'minute' : 'minutes'}}</div>
    </div>
    <div class="step-control up">
      <font-awesome-icon class="link" :icon="['fal', 'chevron-up']" v-if="currentStep > 0" @click="changeStep(-1);" />
      <div class="key-guide" v-if="currentStep > 0">
        <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> up
      </div>
      <span class="end-point" v-if="currentStep === 0">start</span>
    </div>
    <div class="current-step">
      <div v-bind:style="currentStepStyle">{{selectedRecipes[0].steps[currentStep].description}}</div>
    </div>
    <div class="step-control down">
      <div class="key-guide" v-if="currentStep < selectedRecipes[0].steps.length - 1">
        <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> down
      </div>
      <font-awesome-icon class="link" :icon="['fal', 'chevron-down']" v-if="currentStep < selectedRecipes[0].steps.length - 1" @click="changeStep(1);" />
      <span class="link end-point" v-if="currentStep === selectedRecipes[0].steps.length - 1">finish</span>
    </div>
    <div class="recipe-details">
      <h4>{{selectedRecipes[0].details.name}}</h4>
      <div class="image" v-bind:style="selectedRecipes[0].details.imageStyle"></div>
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <span class="nav-link link" v-bind:class="{'active': activeDetail == 'ingredients'}" @click="activeDetail = 'ingredients'">Ingredients</span>
        </li>
        <li class="nav-item">
          <span class="nav-link link" v-bind:class="{'active': activeDetail == 'steps'}" @click="activeDetail = 'steps'">Steps</span>
        </li>
      </ul>
      <div class="steps" v-if="activeDetail == 'steps'">
        <table class="table table-sm" v-if="selectedRecipes[0].steps.length > 0">
          <tbody>
            <tr v-for="(step, index) in selectedRecipes[0].steps" v-bind:key="index" v-bind:class="{'active-step': index == currentStep}">
              <td style="width: 40px;">
                <span class="badge badge-light badge-pill">{{index + 1}}</span>
              </td>
              <td>{{step.description}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ingredients" v-if="activeDetail == 'ingredients'">
        <div class="component" v-for="(ingredients, component) in selectedRecipes[0].ingredients" v-bind:key="component">
          <table class="table table-sm">
            <tbody>
              <tr v-if="selectedRecipes[0].ingredients.length > 1">
                <td colspan="2">
                  <h5>{{ingredients.component}}</h5>
                </td>
              </tr>
              <tr v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                <td style="width: 60px;" class="quantity">{{ingredient.quantity}} {{ingredient.unit}}</td>
                <td>{{ingredient.description}}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty" v-if="ingredients.list.length === 0">
            no ingredients to show
          </div>
        </div>
      </div>
    </div>
    <div class="ingredients-used" v-bind:class="{'shown': showIngredients}" @click="toggleIngredients()">
      <div class="ingredients-panel" v-if="selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0">
        <div class="label">Ingredients used</div>
        <div class="tab" v-bind:class="{'link': selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0, 'shown': showIngredients}" @click="toggleIngredients($event)">
          <span>
            <font-awesome-icon :icon="['fal', {true: 'arrow-down', false: 'arrow-up'}[showIngredients]]" @click="changeStep(-1);" /> {{showIngredients ? 'hide' : 'show'}}
            <span class="badge key-guide">
              (<font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> i)
            </span>
          </span>
        </div>
        <div class="ingredients" v-show="showIngredients">
          <div class="ingredient" v-for="(ingredient, index) in selectedRecipes[0].steps[currentStep].ingredientsUsed" v-bind:key="index">
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
      showIngredients: false,
      activeDetail: 'ingredients'
    };
  },
  computed: {
    selectedRecipes: function(){
      return this.$store.state.selectedRecipes;
    },
    currentStepStyle: function(){
      var characters = this.selectedRecipes[0].steps[this.currentStep].description.length;
      var size = 25;

      if(characters < 50) size += 3;
      if(characters < 100) size += 2;
      if(characters > 150) size -= 1;
      if(characters > 200) size -= 1;
      if(characters > 250) size -= 2;
      if(characters > 300) size -= 3;

      console.log(size/10, characters);

      return {
        fontSize: size/10 + 'em'
      };
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
      if(e.key == 'i') this.toggleIngredients();
    }
  },
  created: function(){
    window.addEventListener('keydown', this.handleKeyPress);
    var selectedRecipeIds = localStorage.getItem('selectedRecipes');
    this.selectedRecipeIds = JSON.parse(selectedRecipeIds);
    if(selectedRecipeIds) this.$store.dispatch('loadSelectedRecipes', this.selectedRecipeIds);
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
  grid-column-gap: 20px;
  padding: 20px;
  text-align: center;
  align-items: center;
  .screen-xs-max({
    grid-template-rows: 20% 60% 20%;
  });
  .screen-md-min({
    grid-template-columns: auto 300px;
  });
  .back-to-recipe {
    grid-column-start: 1;
    grid-row-start: 1;
    align-self: start;
    justify-self: start;
  }
  .info {
    grid-column-start: 1;
    justify-self: end;
    font-size: 1em;
    font-weight: 100;
    text-align: right;
    pointer-events: none;
    &.method-progress {
      grid-row-start: 1;
      align-self: start;
    }
    &.step-estimate {
      grid-row-start: 3;
      align-self: end;
    }
    div:nth-child(2){
      font-size: 1.4em;
      font-weight: 400;
      line-height: 1;
    }
  }
  .step-control {
    font-size: 5em;
    line-height: 1;
    grid-column-start: 1;
    .screen-xs-max({
      font-size: 4em;
    });
    &.up {
      align-self: end;
      grid-row-start: 1;
      .screen-xs-max({ margin-bottom: 5%; });
    }
    &.down {
      align-self: start;
      grid-row-start: 3;
      .screen-xs-max({ margin-top: 5%; });
    }
    > .end-point {
      font-size: 0.5em;
      line-height: 2;
    }
    .key-guide {
      font-size: 0.2em;
    }
  }
  .key-guide {
    font-weight: 400;
    .screen-xs-max({
      display: none;
    });
  }
  .current-step {
    font-weight: 100;
    padding: 20px 5%;
    grid-column-start: 1;
    grid-row-start: 2;
    .screen-tiny({ font-size: 11px; line-height: 1.2; });
    .screen-xxs({ font-size: 12px; });
    .screen-xs({ font-size: 13px; });
    .screen-sm({ font-size: 14px; });
    .screen-md({ font-size: 16px; });
    .screen-lg-min({ font-size: 18px; });
  }
  .recipe-details {
    position: absolute;
    right: 0;
    top: -20px;
    left: 0;
    bottom: 0;
    padding: 20px;
    grid-row-start: 1;
    grid-column-start: 2;
    background-color: #f7f7f7;
    border-left: 5px solid #ccc;
    text-align: left;
    overflow-y: scroll;
    .screen-sm-max({
      display: none;
    });
    > .image {
      height: 200px;
      border: 1px solid #e7e7e7;
    }
    > .nav {
      margin: 20px 0;
    }
    > .ingredients {}
    > .steps {
      .active-step {
        background-color: #e7e7e7;
      }
    }
  }
  .ingredients-used {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
    z-index: 0;
    &.shown {
      top: 0;
      background-color: #000000bf;
      cursor: pointer;
      .ingredients-panel {
        right: 0;
        max-height: 90%;
        overflow-y: scroll;
      }
    }
    .ingredients-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: auto;
      > .label {
        padding: 0 20px;
        margin-bottom: -15px;
        font-weight: 100;
      }
      > .tab {
        display: inline-block;
        margin-left: 20px;
        line-height: 1;
        padding: 20px 0;
        &.shown {
          color: lighten(@brown, 30%);
        }
        > span > svg {
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
        .screen-xs-max({
          grid-template-columns: 1fr 1fr;
        });
        > .ingredient {
          display: inline-block;
          height: 100%;
          border: 1px solid #ccc;
          > div {
            &:nth-child(1){
              padding: 10px 20px;
              background-color: lighten(@yellow, 20%);
              border-bottom: 2px solid #999;
              font-weight: 700;
            }
            &:nth-child(2){
              padding: 20px;
              font-size: 1.1em;
            }
          }
        }
      }
    }
  }
}
</style>
