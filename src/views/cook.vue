<template>
  <div class="cook content" v-if="selectedRecipe">
    <div class="manager">
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
        <span>{{servingTime}}</span>
      </div>
      <timer :timer="progress.timer" mode="button" v-if="progress.timer.step !== null && !progress.timer.show" />
    </div>
    <div class="current-step" v-if="progress.timer.step !== null && progress.timer.show">
      <div class="step-control prev" v-if="selectedRecipe.steps[progress.currentStep].dependsOn !== progress.timer.step">
        <button class="btn secondary" @click="progress.timer.show = false">
          <font-awesome-icon :icon="['fal', 'times']" />
        </button>
      </div>
      <div class="step-control next">
        <button class="btn primary" @click="closeTimer()">
          <font-awesome-icon :icon="['fal', 'check']" />
        </button>
      </div>
      <div class="method-progress">
        <timer :timer="progress.timer" mode="text" v-if="progress.timer.show" />
      </div>
      <div class="step-description">
        <div v-bind:style="currentStepStyle">{{selectedRecipe.steps[progress.timer.step].description}}</div>
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
    <div class="current-step" v-if="progress.timer.step === null || (progress.timer.step !== null && !progress.timer.show)">
      <div class="step-control prev">
        <button class="btn secondary" @click="changeStep(-1);" v-if="progress.currentStep > 0">
          <font-awesome-icon :icon="['fal', 'arrow-left']" />
        </button>
      </div>
      <div class="step-control next">
        <button class="btn primary" @click="changeStep(1);" v-if="progress.currentStep < selectedRecipe.steps.length - 1">
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
        <div v-bind:style="currentStepStyle">{{selectedRecipe.steps[progress.currentStep].description}}</div>
      </div>
      <timer :timer="progress.timer" mode="button" v-if="progress.timer.step !== null && !progress.timer.show" />
    </div>
    <div class="ingredients-used" v-bind:class="{'shown': showIngredients}" @click="toggleIngredients($event)" v-if="progress.timer.step === null || (progress.timer.step !== null && !progress.timer.show)">
      <button class="btn link" @click="toggleIngredients($event)" v-if="selectedRecipe.steps[progress.currentStep].ingredientsUsed.length > 0">
        ingredients
        <span class="badge key-guide">
          <font-awesome-icon :icon="['fal', 'keyboard']" /> i
        </span>
      </button>
      <div class="ingredients-panel" v-if="selectedRecipe.steps[progress.currentStep].ingredientsUsed.length > 0">
        <div class="ingredients" v-show="showIngredients">
          <h5>For this step</h5>
          <div class="ingredient" v-for="(ingredient, index) in selectedRecipe.steps[progress.currentStep].ingredientsUsed" v-bind:key="index">
            <div>{{ingredient.quantity}} {{findIngredient(ingredient, selectedRecipe).unit}}</div>
            <div>{{findIngredient(ingredient, selectedRecipe).description}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import moment from 'moment';

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
      timeToAdd: 0
    };
  },
  computed: {
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    currentStepStyle: function(){
      var currentStep = this.progress.timer.step !== null && this.progress.timer.show ? this.progress.timer.step : this.progress.currentStep;
      var characters = this.selectedRecipe.steps[currentStep].description.length;
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
    },
    timeLeft: function(){
      return this.calcTimeLeft(this.progress.timer);
    }
  },
  methods: {
    changeStep: function(direction){
      if(this.progress.currentStep == 0 && direction == -1) return;
      if(this.progress.currentStep == this.selectedRecipe.steps.length-1 && direction == 1) return;
      if(this.selectedRecipe.steps[this.progress.currentStep].parallel && direction === 1) this.setTimer();
      this.progress.currentStep += direction;
      this.showIngredients = false;

    },
    setTimer: function(){
      this.progress.timer = {
        step: this.progress.currentStep,
        duration: this.selectedRecipe.steps[this.progress.currentStep].duration,
        started: moment(),
        timeAdded: 0,
        show: false
      };
      var minutes = this.progress.timer.duration + ' minute';
      if(this.progress.timer.duration > 1) minutes +=  's';
      this.$store.commit('setUserMessage', { text: 'timer set for ' + minutes, type: 'text-success' });
    },
    adjustTimer: function(adjust){
      this.progress.timer.timeAdded = parseInt(this.progress.timer.timeAdded) + adjust;
    },
    closeTimer: function(){
      var that = this;
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
      if(e) e.stopPropagation();
      if(this.selectedRecipe.steps[this.progress.currentStep].ingredientsUsed.length > 0) this.showIngredients = !this.showIngredients;
    },
    handleKeyPress: function(e){
      if(e.key == 'ArrowLeft') this.changeStep(-1);
      if(e.key == 'ArrowRight') this.changeStep(1);
      if(e.key == 'i') this.toggleIngredients();
    }
  },
  created: function(){
    window.addEventListener('keydown', this.handleKeyPress);
    if(this.selectedRecipe) this.calcServingTime(this.selectedRecipe, 'time');
  },
  watch: {
    selectedRecipe: function(selectedRecipe){
      if(selectedRecipe) this.calcServingTime(selectedRecipe, 'time');
    },
    progress: {
      handler: function (progress) {
        localStorage.setItem('progress', JSON.stringify(progress));
        this.calcServingTime(this.selectedRecipe, 'time', true);
      },
      deep: true
    }
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
  grid-template-rows: 72px auto;
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
    .screen-sm-min({
      position: relative;
      margin-top: 0;
      padding: 20px;
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
          font-size: 2em;
          margin: 0 -20px 20px;
          padding: 10px 20px;
          color: initial;
          background-color: #e7e7e7;
          border: 1px solid #ccc;
          border-width: 1px 0;
          text-align: center;
          > svg {
              margin: 0 10px 0 0;
          }
        });
      }
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
    grid-template-rows: 100px auto 100px;
    text-align: center;
    align-items: center;
    .screen-xs-max({
      grid-template-rows: 20% auto 20%;
      grid-row-start: 2;
    });
    .method-progress {
      grid-column-start: 1;
      grid-row-start: 1;
      text-align: center;
      align-self: start;
      justify-self: center;
      margin-top: 20px;
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
        }
        > svg {
          margin: 0;
          font-size: 2em;
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
      > .btn {
        height: 80px;
        width: 80px;
        font-size: 1.6em;
        > svg {
          margin-right: 0;
          vertical-align: top;
        }
      }
      &.prev {
        justify-self: start;
        > .btn {
          text-align: left;
          padding: 0 0 0 20px;
          border-radius: 0 0 100%;
          border-width: 0 3px 3px 0;
        }
      }
      &.next {
        justify-self: end;
        > .btn {
          text-align: right;
          padding: 0 20px 0 0;
          border-radius: 0 0 0 100%;
          border-width: 0 0 3px 3px;
        }
      }
    }
    .step-description {
      font-weight: 100;
      padding: 0 5%;
      grid-column-start: 1;
      grid-row-start: 2;
      .screen-tiny({ font-size: 10px; line-height: 1.2; });
      .screen-xxs({ font-size: 11px; line-height: 1.2; });
      .screen-xs({ font-size: 13px; });
      .screen-sm({ font-size: 14px; });
      .screen-md({ font-size: 16px; });
      .screen-lg-min({ font-size: 18px; });
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
  .ingredients-used {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: left;
    z-index: 0;
    &:not(.shown){
      pointer-events: none;
    }
    &.shown {
      top: 0;
      background-color: #000000bf;
      cursor: pointer;
      pointer-events: all;
      > button {
        display: none;
      }
      > .ingredients-panel {
        right: 0;
        max-height: 90%;
        overflow-y: scroll;
      }
    }
    > button {
      margin: 0 0 20px 20px;
      > .key-guide {
        text-transform: lowercase;
        font-size: 1em;
        > svg {
          margin: 0 5px 0 10px
        }
      }
    }
    > .ingredients-panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: auto;
      > .ingredients {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        grid-gap: 20px;
        background-color: #fff;
        padding: 20px;
        cursor: default;
        .screen-xs-max({
          grid-template-columns: 1fr 1fr;
        });
        > h5 {
          grid-row: 1/2;
          grid-column: 1/6;
          margin-bottom: 0;
          .screen-xs-max({
            grid-column: 1/3;
          });
        }
        > .ingredient {
          display: inline-block;
          height: 100%;
          border: 1px solid #ccc;
          text-align: center;
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
