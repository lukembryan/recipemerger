<template>
  <div class="cook content" v-if="selectedRecipe">
    <div class="manager" ref="manager">
      <div class="side">
        <router-link :to="{ name: 'recipe', params: {recipe: progress.id}}" class="link">
          <font-awesome-icon :icon="['fal', 'chevron-left']" /> recipe details
        </router-link>
        <h4>{{selectedRecipe.details.name}}</h4>
      </div>
      <router-link :to="{ name: 'recipe', params: {recipe: progress.id}}" class="recipe-name link">
        <font-awesome-icon :icon="['fal', 'chevron-left']" /> {{selectedRecipe.details.name}}
      </router-link>
      <div class="info serving-time" v-if="selectedRecipe">
        <font-awesome-icon :icon="['fal', 'utensils']" />
        <span>Serving at {{servingTime}}</span>
      </div>
      <div class="image" v-bind:style="selectedRecipe.details.imageStyle"></div>
      <timer :timer="progress.timer" mode="button" :class="{'shown': progress.timer.step !== null && !progress.timer.show}" />
    </div>

    <!-- TIMER VIEW -->
    <div class="current-step" ref="recipe"
      v-if="progress.timer.step !== null && progress.timer.show"
      v-hammer:swipe="onSwipe">
      <div class="step-control prev" :class="{'shown': selectedRecipe.steps[progress.currentStep].dependsOn !== progress.timer.step}">
        <button class="btn secondary" @click="progress.timer.show = false">
          <font-awesome-icon :icon="['fal', 'times']" />
        </button>
      </div>
      <div class="step-control next shown">
        <button class="btn primary" @click="closeTimer()">
          <font-awesome-icon :icon="['fal', 'check']" />
        </button>
      </div>
      <div class="method-progress">
        <timer :timer="progress.timer" mode="text" v-if="progress.timer.show" />
      </div>
      <div class="step-description">
        <div v-bind:style="currentStepStyle(null)">{{selectedRecipe.steps[progress.timer.step].description}}</div>
      </div>
      <form class="info adjust-timer">
        <div>Adjust timer</div>
        <div class="controls">
          <font-awesome-icon :icon="['fal', 'minus']" class="link" @click="adjustTimer(-1)" />
          <span>{{progress.timer.timeAdded}}</span>
          <font-awesome-icon :icon="['fal', 'plus']" class="link" @click="adjustTimer(1)" />
          <div>mins</div>
        </div>
      </form>
    </div>
    <!-- TIMER VIEW -->

    <!-- NORMAL STEP VIEW -->
    <div class="current-step" ref="recipe"
      v-if="progress.timer.step === null || (progress.timer.step !== null && !progress.timer.show)"
      v-hammer:swipe="onSwipe">
      <div class="step-control prev" v-bind:class="{'shown': progress.currentStep > 0}">
        <button class="btn secondary" @click="changeStep(-1);">
          <font-awesome-icon :icon="['fal', 'arrow-left']" />
        </button>
      </div>
      <div class="step-control next" v-bind:class="{'shown': progress.currentStep < selectedRecipe.steps.length - 1 || selectedRecipe.steps[progress.currentStep].parallel}">
        <button class="btn primary" @click="changeStep(1);">
          <font-awesome-icon :icon="['fal', 'arrow-right']" v-if="!selectedRecipe.steps[progress.currentStep].parallel" />
          <font-awesome-icon :icon="['fal', 'stopwatch']" v-if="selectedRecipe.steps[progress.currentStep].parallel" />
        </button>
      </div>
      <div class="method-progress">
        <div>{{progress.currentStep+1}} of {{selectedRecipe.steps.length}}</div>
        <div class="key-guide">
          <font-awesome-icon :icon="['fal', 'chevron-left']" />
          <font-awesome-icon :icon="['fal', 'keyboard']" />
          <font-awesome-icon :icon="['fal', 'chevron-right']" />
        </div>
      </div>
      <div class="step-description">
        <div v-bind:style="currentStepStyle(index)" v-for="(step, index) in selectedRecipe.steps" :key="index">
          {{step.description}}
        </div>
      </div>
      <timer :timer="progress.timer" mode="button" v-if="progress.timer.step !== null && !progress.timer.show" />
    </div>
    <!-- NORMAL STEP VIEW -->

    <button class="ingredients-btn btn link" @click="toggleIngredients($event)" v-if="selectedRecipe.steps[progress.currentStep].ingredientsUsed.length > 0 && !progress.timer.show">
      ingredients
      <span class="badge key-guide">
        <font-awesome-icon :icon="['fal', 'keyboard']" /> i
      </span>
    </button>
    <div class="ingredients-used" ref="ingredients-used"
          v-bind:class="{'shown': showIngredients}"
          @click="toggleIngredients($event)">
      <div ref="ingredients-panel" class="ingredients-panel">
        <div class="ingredients">
          <h5>Used in this step:</h5>
          <div class="ingredient" v-for="(ingredient, index) in selectedRecipe.steps[progress.currentStep].ingredientsUsed" v-bind:key="index">
            <div class="quantity">{{ingredient.quantity}} {{findIngredient(ingredient, selectedRecipe).unit}}</div>
            <div class="description">
              <div>{{findIngredient(ingredient, selectedRecipe).description}}</div>
              <span style="margin-top: 10px;" class="badge badge-light badge-pill" v-if="findIngredient(ingredient, selectedRecipe).preparation">{{findIngredient(ingredient, selectedRecipe).preparation}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import moment from 'moment';
import Velocity from 'velocity-animate';

import timer from '@/components/timer.vue';

import 'hooper/dist/hooper.css';

export default {
  name: 'cook',
  mixins: [mixins],
  components: {
    timer
  },
  data: function(){
    return {
      moment: moment,
      showIngredients: false,
      timeToAdd: 0,
      offsetStepDescription: null
    };
  },
  computed: {
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    timeLeft: function(){
      return this.calcTimeLeft(this.progress.timer);
    }
  },
  methods: {
    changeStep: function(direction){
      var that = this;

      if(this.progress.currentStep == 0 && direction === -1) return;
      if(this.progress.currentStep == this.selectedRecipe.steps.length-1 && direction == 1) return;

      if(direction === 0) return;
      if(this.selectedRecipe.steps[this.progress.currentStep].parallel && direction === 1) this.setTimer();
      this.progress.currentStep += direction;

      setTimeout(function(){
        that.showIngredients = false;
      }, 150);
    },
    currentStepStyle: function(step){
      var showingTimer = this.progress.timer.step !== null && this.progress.timer.show;
      var offset = showingTimer ? 0 : step - this.progress.currentStep;

      var currentStep = showingTimer ? this.progress.timer.step : step;
      var characters = this.selectedRecipe.steps[currentStep].description.length;
      var size = 25;

      if(this.selectedRecipe.steps[currentStep]){
        if(characters < 50) size += 3;
        if(characters < 100) size += 2;
        if(characters > 150) size -= 1;
        if(characters > 200) size -= 1;
        if(characters > 250) size -= 2;
        if(characters > 300) size -= 3;

        //console.log(size/10, characters);
      }

      return {
        fontSize: size/10 + 'em',
        left: offset * 100 + '%',
      };
    },
    setTimer: function(){
      this.progress.timer = {
        step: this.progress.currentStep,
        duration: this.selectedRecipe.steps[this.progress.currentStep].duration,
        started: moment(),
        timeAdded: 0,
        show: false
      };
    },
    adjustTimer: function(adjust){
      this.progress.timer.timeAdded = parseInt(this.progress.timer.timeAdded) + adjust;
    },
    toggleTimer: function(show){
      var recipe = this.$refs['recipe'];
      var timer = this.$refs['timer'];
      Velocity(recipe, { opacity: (show ? 1 : 0) }, { delay: (show ? 150 : 0), easing: 'easeInQuad' }, 150);
      Velocity(timer, { opacity: (show ? 1 : 0) }, { delay: (show ? 0 : 150), easing: 'easeInQuad' }, 150);
    },
    closeTimer: function(){
      var that = this;
      this.$store.commit('setDialogMessage', { text: 'Are you sure you are finished timing this step?', proceed: function(){
        var timerDescription = that.$refs['timer-description'];
        Velocity(timerDescription, { opacity: 0 }, { delay: 0, easing: 'easeInQuad' }, 150);

        that.progress.timer = {
          step: null,
          duration: 0,
          started: null,
          timeAdded: 0,
          show: false
        };
      } });
    },
    toggleIngredients: function(e){
      var ingredientsUsed = this.$refs['ingredients-used'];
      var ingredientsPanel = this.$refs['ingredients-panel'];
      if(e) e.stopPropagation();
      if(this.selectedRecipe.steps[this.progress.currentStep].ingredientsUsed.length > 0){
        this.showIngredients = !this.showIngredients;
        if(ingredientsUsed){
          if(this.showIngredients) Velocity(ingredientsUsed, { opacity: 1 }, { delay: 0, easing: 'easeInQuad' }, 300);
          else Velocity(ingredientsUsed, { opacity: 0 }, { delay: 300, easing: 'easeInQuad' }, 300);
        }
        if(ingredientsPanel){
          if(this.showIngredients) Velocity(ingredientsPanel, { bottom: 0 }, { delay: 0, easing: 'easeInQuad' }, 300);
          else Velocity(ingredientsPanel, { bottom: -500 }, { delay: 0, easing: 'easeInQuad' }, 300);
        }
      }
    },
    handleKeyPress: function(e){
      if(e.key == 'ArrowLeft') this.changeStep(-1);
      if(e.key == 'ArrowRight') this.changeStep(1);
      if(e.key == 'i') this.toggleIngredients();
    },
    onSwipe: function(e){
      var showingTimer = this.progress.timer.step !== null && this.progress.timer.show;
      if(showingTimer){
        if(e.direction === 2) this.closeTimer();
        if(e.direction === 4) this.progress.timer.show = false;
      }else{
        if(e.direction === 2) this.changeStep(1);
        if(e.direction === 4) this.changeStep(-1);
      }
      if(e.direction === 8) this.toggleIngredients();
      //if(e.direction === 16) this.toggleIngredients();
    }
  },
  created: function(){
    window.addEventListener('keydown', this.handleKeyPress);
    if(this.selectedRecipe) this.calcServingTime(this.selectedRecipe, 'time');
  },
  watch: {
    selectedRecipe: function(selectedRecipe){
      if(selectedRecipe) this.calcServingTime(selectedRecipe, 'time', true);
    },
    progress: {
      handler: function (progress) {
        localStorage.setItem('progress', JSON.stringify(progress));
        this.calcServingTime(this.selectedRecipe, 'time', true);
        //this.toggleTimer(progress.timer.show);
      },
      deep: true
    }
  },
  beforeDestroy: function(){
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  mounted: function(){
    var that = this;
    var checkForRecipe = setInterval(function(){
      var recipe = that.$refs['recipe'];
      var manager = that.$refs['manager'];
      if(recipe){
        Velocity(recipe, { opacity: 1 }, { delay: 300, easing: 'easeInQuad' }, 150);
        Velocity(manager, { left: 0 }, { delay: 0, easing: 'easeInQuad' }, 150);
        clearInterval(checkForRecipe);
      }
    }, 100);
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.cook {
  position: relative;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 72px auto;
  background-color: #efefef;
  overflow-y: hidden;
  overflow-x: hidden;
  .screen-sm-min({
    grid-template-columns: 300px auto;
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
    color: #fff;
    background-color: #333;
    height: 74px;
    padding: 0 20px;
    left: -100%;
    box-shadow: #333 -3px 8px 15px;
    z-index: 1;
    .screen-xs-max({
      box-shadow: none;
    });
    .screen-sm-min({
      position: relative;
      margin-top: 0;
      padding: 0;
      height: 100%;
      grid-row: 1/5;
      grid-column-start: 1;
    });
    > .side {
      display: none;
      .screen-sm-min({
        display: block;
      });
      > h4 {
        text-align: center;
        margin: 40px 0 20px;
      }
      > a {
        display: block;
        margin: 20px 0 0 20px;
      }
    }
    > .recipe-name {
      font-size: 1.2em;
      margin-top: 7px;
      .screen-sm-min({
        display: none;
      });
      .screen-xs-max({
        display: block;
      });
    }
    > .info {
      font-size: 1.2em;
      text-align: left;
      .screen-xs-max({
        display: inline-block;
        line-height: 33px;
        font-size: 1.1em;
      });
      .screen-sm-min({
        display: block;
        margin: 20px auto 0 0;
      });
      > svg {
        margin-right: 5px;
        .screen-sm-min({
          font-size: 1em;
          margin: 0 5px 0 15px;
        });
      }
      &.serving-time {
        .screen-sm-min({
          font-size: 1.5em;
          padding: 10px 20px;
          color: initial;
          background-color: #e7e7e7;
          border-bottom: 1px solid #999;
          border-width: 1px 0;
          text-align: center;
          > svg {
              margin: 0 10px 0 0;
          }
        });
      }
    }
    > .image {
      height: 300px;
      .screen-xs-max({
        display: none;
      });
    }
    > .timer {
      text-align: center;
      .screen-xs-max({
        display: none;
      });
    }
  }
  .current-step {
    display: grid;
    position: relative;
    grid-template-rows: 150px auto;
    text-align: center;
    align-items: center;
    grid-row-start: 1;
    opacity: 0;
    .screen-xs-max({
      grid-template-rows: 100px auto;
      grid-row-start: 2;
    });
    .method-progress {
      pointer-events: none;
      align-self: center;
      grid-row-start: 1;
      grid-column-start: 1;
      font-size: 1.8em;
      line-height: 1;
      font-weight: 100;
      .screen-xs-max({
        font-size: 1.4em;
      });
    }
    .adjust-timer {
      align-self: end;
      margin: 0 0 20px;
      > .controls {
        line-height: 1;
        > span {
          margin: 0 20px;
          font-size: 2em;
          .screen-sm-min({
            font-size: 2.8em;
          });
        }
        > svg {
          margin: 0;
          font-size: 2em;
          .screen-sm-min({
            font-size: 3em;
            width: 30px;
            height: auto;
          });
        }
        > div {
          font-size: 0.8em;
        }
      }
    }
    .step-control {
      grid-column-start: 1;
      grid-row-start: 1;
      align-self: start;
      line-height: 1;
      opacity: 0;
      &.shown {
        opacity: 1;
        > .btn {
          > svg {
            opacity: 1;
          }
        }
      }
      > .btn {
        height: 80px;
        width: 80px;
        font-size: 1.6em;
        .screen-sm-min({
          height: 120px;
          width: 120px;
          font-size: 2.5em;
        });
        > svg {
          opacity: 0;
          margin-right: 0;
          vertical-align: top;
          transition: all ease-in-out 0.3s;
        }
      }
      &.prev {
        justify-self: start;
        margin: -100% 100% 100% -100%;
        transition: all ease-in-out 0.3s 0.3s;
        &.shown {
          margin: 0;
          transition: all ease-in-out 0.3s;
        }
        > .btn {
          text-align: left;
          padding: 0 0 0 30px;
          border-radius: 0 0 100%;
          border-width: 0 3px 3px 0;
          .screen-xs-max({
            padding: 0 0 0 20px;
          });
        }
      }
      &.next {
        justify-self: end;
        > .btn {
          text-align: right;
          padding: 0 30px 0 0;
          border-radius: 0 0 0 100%;
          border-width: 0 0 3px 3px;
          .screen-xs-max({
            padding: 0 20px 0 0;
          });
        }
      }
    }
    .step-description {
      font-weight: 100;
      width: 100%;
      height: 100%;
      grid-column-start: 1;
      grid-row-start: 2;
      align-self: start;
      .screen-tiny({ font-size: 10px; line-height: 1.2; });
      .screen-xxs({ font-size: 11px; line-height: 1.2; });
      .screen-xs({ font-size: 13px; });
      .screen-sm({ font-size: 14px; });
      .screen-md({ font-size: 16px; });
      .screen-lg-min({ font-size: 19px; });
      > div {
        position: absolute;
        width: 100%;
        transition: all ease-in-out 0.3s;
        .screen-tiny({ padding: 0 20px; });
        .screen-xxs({ padding: 0 30px; });
        .screen-xs({ padding: 0 40px; });
        .screen-sm({ padding: 0 50px; });
        .screen-md({ padding: 0 100px; });
        .screen-lg-min({ padding: 0 15%; });
      }
    }
    .timer {
      align-self: end;
      justify-self: end;
      margin: 0 20px 20px 0;
      &:not(.text){
        .screen-sm-min({
          display: none;
        });
      }
      &.text {
        margin: 0;
      }
      > button {
        border-bottom: none !important;
      }
    }
  }
  .key-guide {
    margin-top: 10px;
    font-weight: 400;
    font-size: 0.6em;
    > svg {
      margin: 0;
      &.fa-keyboard {
        margin: 0 10px;
      }
    }
    .screen-xs-max({
      display: none;
    });
  }
  .ingredients-btn {
    position: absolute;
    bottom: 0;
    padding: 20px;
    z-index: 1;
    > .key-guide {
      text-transform: lowercase;
      font-size: 1em;
      > svg {
        margin: 0 5px 0 10px
      }
    }
  }
  .ingredients-used {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
    background-color: #000000bf;
    opacity: 0;
    z-index: 1;
    &:not(.shown){
      pointer-events: none;
    }
    > .ingredients-panel {
      position: absolute;
      bottom: -500px;
      left: 0;
      right: 0;
      max-height: 90%;
      overflow-y: scroll;
      cursor: pointer;
      pointer-events: all;
      > .ingredients {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-gap: 20px;
        background-color: #fff;
        padding: 20px;
        .screen-xxs-max({
          grid-template-columns: 1fr 1fr;
        });
        .screen-xs({
          grid-template-columns: 1fr 1fr 1fr;
        });
        > h5 {
          grid-row: 1/2;
          grid-column: 1/6;
          margin-bottom: 0;
          .screen-xxs-max({
            grid-column: 1/3;
          });
          .screen-xs({
            grid-column: 1/4;
          });
        }
        > .ingredient {
          display: inline-block;
          height: 100%;
          border: 1px solid #ccc;
          text-align: center;
          &:nth-child(2), &:nth-child(7) { .quantity {background-color: @purple; } }
          &:nth-child(3), &:nth-child(8) { .quantity {background-color: @red; } }
          &:nth-child(4), &:nth-child(9) { .quantity { background-color: @brown; } }
          &:nth-child(5), &:nth-child(10) { .quantity {background-color: @yellow; } }
          &:nth-child(6), &:nth-child(11) { .quantity {background-color: @green; } }
          > div {
            &.quantity {
              padding: 5px 10px;
              border-bottom: 2px solid #999;
              font-weight: 400;
              color: #fff;
            }
            &.description {
              padding: 10px;
              font-size: 1em;
              line-height: 1.2;
            }
          }
        }
      }
    }
  }
}
</style>
