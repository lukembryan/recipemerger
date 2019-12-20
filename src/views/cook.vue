<template>
  <div class="cook content" v-if="selectedRecipes[0]">
    <div class="manager">
      <h4>{{selectedRecipes[0].details.name}}</h4>
      <div class="info serving-time" v-if="selectedRecipes[0]">
        <font-awesome-icon :icon="['fal', 'utensils']" />
        <span>7:10 pm</span>
      </div>
      <div class="info timer">
        <font-awesome-icon :icon="['fal', 'stopwatch']" class="link" />
        <span>22 mins left</span>
        <span>
          for step <span class="badge badge-pill badge-light">2</span>
        </span>
      </div>
    </div>
    <div class="current-step">
      <router-link :to="{ name: 'recipe', params: {recipe: selectedRecipeIds[0]}}" class="show-recipe-details link">
        <font-awesome-icon :icon="['fal', 'chevron-left']" /> recipe details
      </router-link>
      <div class="info method-progress">
        <div>Step</div>
        <div>{{currentStep+1}} of {{selectedRecipes[0].steps.length}}</div>
      </div>
      <div class="info step-estimate">
        <div>Should take</div>
        <div>~ {{selectedRecipes[0].steps[currentStep].duration}} {{selectedRecipes[0].steps[currentStep].duration == 1 ? 'min' : 'mins'}}</div>
      </div>
      <div class="step-control up">
        <font-awesome-icon class="link" :icon="['fal', 'chevron-up']" v-if="currentStep > 0" @click="changeStep(-1);" />
          <div class="key-guide" v-if="currentStep > 0">
            <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> up
          </div>
          <span class="end-point" v-if="currentStep === 0">start</span>
        </div>
      <div class="step-description">
        <div v-bind:style="currentStepStyle">{{selectedRecipes[0].steps[currentStep].description}}</div>
      </div>
      <div class="step-control down">
        <div class="key-guide" v-if="currentStep < selectedRecipes[0].steps.length - 1">
          <font-awesome-icon :icon="['fal', 'keyboard']" @click="changeStep(-1);" /> down
        </div>
        <font-awesome-icon class="link" :icon="['fal', 'chevron-down']" v-if="currentStep < selectedRecipes[0].steps.length - 1" @click="changeStep(1);" />
        <span class="link end-point" v-if="currentStep === selectedRecipes[0].steps.length - 1">finish</span>
      </div>
    </div>
    <div class="ingredients-used" v-bind:class="{'shown': showIngredients}" @click="toggleIngredients()">
      <div class="ingredients-panel" v-if="selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0">
        <div class="tab" v-bind:class="{'link': selectedRecipes[0].steps[currentStep].ingredientsUsed.length > 0, 'shown': showIngredients}" @click="toggleIngredients($event)">
          <span>
            <font-awesome-icon :icon="['fal', {true: 'arrow-down', false: 'arrow-up'}[showIngredients]]" @click="changeStep(-1);" /> ingredients used
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
      showIngredients: false
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

      //console.log(size/10, characters);

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
  grid-template-columns: 100%;
  grid-template-rows: 50px auto;
  .screen-sm-min({
    grid-template-columns: auto 300px;
    grid-template-rows: 100%;
  });
  .manager {
    position: fixed;
    left: 0;
    right: 0;
    grid-row-start: 1;
    grid-column: 1/2;
    align-self: start;
    justify-items: end;
    background-color: #f7f7f7;
    height: 50px;
    padding: 0 20px;
    text-align: left;
    .screen-xs-max({
      border-bottom: 1px solid #e7e7e7;
    });
    .screen-sm-min({
      position: relative;
      margin-top: 0;
      padding: 20px;
      height: 100%;
      grid-row: 1/5;
      grid-column-start: 2;
      border-left: 5px solid #e7e7e7;
      text-align: center;
    });
    > h4 {
      .screen-xs-max({
        display: none;
      });
    }
    > .info {
      font-size: 1.8em;
      text-align: center;
      .screen-xs-max({
        display: inline-block;
        line-height: 48px;
        font-size: 1.1em;
      });
      > span {
        .screen-sm-min({
          display: block;
        });
      }
      > svg {
        margin-right: 10px;
        .screen-sm-min({
          display: block;
          margin: 40px auto 10px;
          font-size: 2em;
        });
      }
      &.serving-time {
      }
      &.timer {
        float: right;
        .screen-sm-min({
          float: none;
          font-size: 1.3em;
          line-height: 1;
        });
        > span {
          .badge {
            margin: 0;
          }
        }
      }
    }
  }
  .current-step {
    display: grid;
    grid-template-rows: 100px auto 100px;
    padding: 20px;
    text-align: center;
    align-items: center;
    .screen-xs-max({
      grid-template-rows: 20% auto 20%;
      grid-row-start: 2;
    });
    .show-recipe-details {
      grid-column-start: 1;
      grid-row-start: 1;
      align-self: start;
      justify-self: start;
    }
    .info {
      grid-column-start: 1;
      font-size: 1em;
      font-weight: 100;
      pointer-events: none;
      &.method-progress {
        grid-row-start: 1;
        text-align: right;
        align-self: start;
        justify-self: end;
      }
      &.step-estimate {
        grid-row-start: 3;
        text-align: right;
        align-self: end;
        justify-self: end;
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
        .screen-xs-max({
          margin-bottom: 5%;
        });
      }
      &.down {
        align-self: start;
        grid-row-start: 3;
        .screen-xs-max({
          margin-top: 5%;
        });
      }
      > .end-point {
        font-size: 0.5em;
        line-height: 2;
      }
      .key-guide {
        font-size: 0.2em;
      }
    }
    .step-description {
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
  }
  .key-guide {
    font-weight: 400;
    .screen-xs-max({
      display: none;
    });
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
