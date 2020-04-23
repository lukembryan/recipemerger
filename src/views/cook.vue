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
    </div>

    <div class="current-step" v-hammer:swipe="onSwipe">
      <!-- TIMER VIEW -->
      <div class="step-elements" v-if="timerShown" ref="timer">
        <div class="step-control prev shown">
          <button class="btn secondary" @click="progress.timer.show = false">
            <font-awesome-icon :icon="['fal', 'times']" />
          </button>
        </div>
        <div class="step-control next shown">
          <button class="btn primary" @click="closeTimer()">
            <font-awesome-icon :icon="['fal', 'check']" />
          </button>
        </div>
        <div class="step-description">
          <div v-bind:style="currentStepStyle(null)">{{selectedRecipe.steps[progress.timer.step].description}}</div>
        </div>
        <form class="info adjust-timer">
          <div>Adjust timer</div>
          <div class="controls">
            <div class="time">
              <font-awesome-icon :icon="['fal', 'minus']" class="link" @click="adjustTimer(-1)" />
              <span>{{selectedRecipe.steps[progress.timer.step].duration + progress.timer.timeAdded}}</span>
              <span style="font-size: 0.8em;"> min{{selectedRecipe.steps[progress.timer.step].duration + progress.timer.timeAdded === 1 ? '' : 's'}}</span>
              <font-awesome-icon :icon="['fal', 'plus']" class="link" @click="adjustTimer(1)" />
            </div>
          </div>
        </form>
      </div>
      <!-- TIMER VIEW -->
      
      <!-- NORMAL STEP VIEW -->
      <div class="step-elements" v-if="stepShown" ref="recipe">
        <div class="step-control prev" v-bind:class="{'shown': progress.currentStep > 0}">
          <button class="btn secondary" @click="changeStep(-1);">
            <font-awesome-icon :icon="['fal', 'arrow-left']" />
          </button>
        </div>
        <div class="step-control next" v-bind:class="{'shown': showNext}">
          <button class="btn primary" @click="changeStep(1);">
            <font-awesome-icon :icon="['fal', 'arrow-right']" v-if="!selectedRecipe.steps[progress.currentStep].parallel || currentlyTiming" />
            <font-awesome-icon :icon="['fal', 'stopwatch']" v-if="selectedRecipe.steps[progress.currentStep].parallel && !currentlyTiming" />
          </button>
        </div>
        <div class="step-control next shown" v-if="showBackToTimer" @click="progress.timer.show = true;">
          <button style="font-size: 1em; line-height: 1.2; text-align: center;" class="btn link">
            Back to step {{progress.timer.step + 1}}
          </button>
        </div>
        <div class="step-control next shown" v-if="progress.currentStep === selectedRecipe.steps.length - 1 && !showBackToTimer" @click="finishCooking();">
          <button style="font-size: 1em; line-height: 1.2; text-align: center;" class="btn link">
            <font-awesome-icon style="font-size: 2em; margin-bottom: 10px;" :icon="['fal', 'utensils']" /> Served
          </button>
        </div>
        <div class="step-description">
          <div v-bind:style="currentStepStyle(index)" v-for="(step, index) in selectedRecipe.steps" :key="index">
            {{step.description}}
          </div>
        </div>
      </div>
      <!-- NORMAL STEP VIEW -->

      <div class="countdown" :class="{'timer-container': !progress.timer.show, 'method-progress': progress.timer.show}" v-if="progress.timer.step !== null">
        <timer :current-progress="progress" :mode="progress.timer.step !== null && progress.timer.show ? 'text' : 'button'" class="shown" />
      </div>
      <div class="method-progress" v-if="!progress.timer.show">
        <div>{{progress.currentStep+1}} of {{selectedRecipe.steps.length}}</div>
        <div class="key-guide">
          <font-awesome-icon :icon="['fal', 'chevron-left']" />
          <font-awesome-icon :icon="['fal', 'keyboard']" />
          <font-awesome-icon :icon="['fal', 'chevron-right']" />
        </div>
      </div>
    </div>

    <button class="ingredients-btn btn link" @click="toggleIngredients($event)" :class="{'shown': selectedRecipe.steps[progress.currentStep].ingredientsUsed.length > 0 && !progress.timer.show}">
      <span class="count">{{selectedRecipe.steps[progress.currentStep].ingredientsUsed.length}} ingredient{{selectedRecipe.steps[progress.currentStep].ingredientsUsed.length === 1 ? '' : 's'}} used</span>
      <span class="no-count">ingredients</span>
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
              <div class="preparation" v-if="findIngredient(ingredient, selectedRecipe).preparation">
                {{findIngredient(ingredient, selectedRecipe).preparation}}
              </div>
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
      offsetStepDescription: null,
      checkTimeLeft: undefined,
      watchingTimer: false
    };
  },
  computed: {
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    currentlyTiming: function(){
      return this.progress.timer.step === this.progress.currentStep;
    },
    timerShown: function(){
      return this.progress.timer.step !== null && this.progress.timer.show;
    },
    stepShown: function(){
      return this.progress.timer.step === null || (this.progress.timer.step !== null && !this.progress.timer.show);
    },
    showNext: function(){
      var notLast = this.progress.currentStep < this.selectedRecipe.steps.length - 1;
      var hasDependency = this.selectedRecipe.steps[this.progress.currentStep].dependsOn !== null && this.selectedRecipe.steps[this.progress.currentStep].dependsOn === this.progress.timer.step
      return notLast && !hasDependency;
    },
    showBackToTimer: function(){
      var dependentStep = this.progress.timer.step !== null && this.selectedRecipe.steps[this.progress.currentStep].dependsOn === this.progress.timer.step;
      return !this.showNext && dependentStep;
    }
  },
  methods: {
    changeStep: function(direction){
      var that = this;

      if(this.showBackToTimer && direction == 1){
        this.progress.timer.show = true;
        return;
      }

      if(this.progress.currentStep == 0 && direction === -1) return;
      if(this.progress.currentStep == this.selectedRecipe.steps.length-1 && direction == 1) return;

      if(direction === 0) return;
      if(this.selectedRecipe.steps[this.progress.currentStep].parallel && direction === 1) this.setTimer();
      this.progress.currentStep += direction;

      setTimeout(function(){
        that.showIngredients = false;
      }, 150);
    },
    finishCooking: function(){
      console.log('finishCooking');
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

      clearInterval(this.checkTimeLeft);

      this.$store.commit('setDialogMessage', { text: 'Are you sure you are finished timing this step?', proceed: function(){
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
        if(progress.timer.step !== null){
          localStorage.setItem('progress', JSON.stringify(progress));
          this.calcServingTime(this.selectedRecipe, 'time', true);
        }else{
          clearInterval(this.checkTimeLeft);
        }
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
      var timer = that.$refs['timer'];
      var manager = that.$refs['manager'];
      if((recipe || timer) && manager){
        if(recipe) Velocity(recipe, { opacity: 1 }, { delay: 300, easing: 'easeInQuad' }, 150);
        else Velocity(timer, { opacity: 1 }, { delay: 300, easing: 'easeInQuad' }, 150);
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
    position: relative;
    grid-row-start: 1;
    .screen-xs-max({
      grid-row-start: 2;
    });
    > .step-elements {
      display: grid;
      position: relative;
      height: 100%;
      grid-template-rows: 150px auto;
      text-align: center;
      align-items: center;
      .screen-xs-max({
        grid-template-rows: 100px auto;
      });
      .adjust-timer {
        align-self: end;
        margin: 0 0 20px;
        > .controls {
          line-height: 1;
          > .time {
            margin: 0 20px;
            font-size: 1.5em;
            vertical-align: top;
            .screen-sm-min({
              font-size: 1.8em;
            });
            > svg {
              margin: 0;
              font-size: 1.5em;
              vertical-align: text-bottom;
              &.fa-minus {
                margin-right: 15px;
              }
              &.fa-plus {
                margin-left: 15px;
              }
              .screen-sm-min({
                font-size: 3em;
                width: 30px;
                height: auto;
              });
            }
            > .badge {
              font-weight: 400;
            }
          }
        }
      }
      .step-control {
        grid-column-start: 1;
        grid-row-start: 1;
        align-self: start;
        line-height: 1;
        opacity: 0;
        pointer-events: none;
        &.shown {
          opacity: 1;
          pointer-events: all;
          > .btn {
            pointer-events: all;
            > svg {
              opacity: 1;
            }
          }
        }
        > .btn {
          height: 80px;
          width: 80px;
          font-size: 1.6em;
          pointer-events: none;
          .screen-sm-min({
            height: 120px;
            width: 120px;
            font-size: 2.5em;
          });
          > svg {
            width: 1em;
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
            &.link {
              height: auto;
              padding: 25px;
              .screen-xs-max({
                padding: 20px;
                width: 120px;
              });
            }
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
    }
    .timer-container {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1;
      &.text {
        margin: 0;
      }
      > button {
        border-bottom: none !important;
      }
    }
    .method-progress {
      position: absolute;
      top: 0;
      width: 100%;
      margin-top: 25px;
      pointer-events: none;
      font-size: 1.8em;
      line-height: 1;
      font-weight: 100;
      text-align: center;
      .screen-xs-max({
        font-size: 1.4em;
      });
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
    bottom: 20px;
    left: 20px;
    border: 3px solid transparent;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: all ease-in-out 0.3s;
    &.shown {
      opacity: 1;
      pointer-events: all;
    }
    > .key-guide {
      text-transform: lowercase;
      font-size: 1em;
      > svg {
        margin: 0 5px 0 10px
      }
    }
    > .count {
      display: none;
      .screen-sm-min({
        display: inline-block;
      });
    }
    > .no-count {
      display: none;
      .screen-xs-max({
        display: inline-block;
      });
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
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        display: none;
      }
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
              > .preparation {
                margin-top: 10px;
                padding: 10px 15px;
                background-color: #e7e7e7;
                border: 1px solid #666
              }
            }
          }
        }
      }
    }
  }
}
</style>
