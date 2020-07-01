<template>
  <div class="cook content">
    <recipe-test v-if="dev" />
    <div class="loading" ref="loading"><font-awesome-icon :icon="['fal', 'utensils']" /></div>
    <div class="manager" ref="manager">
      <div class="side">
        <router-link :to="{ name: 'recipe', params: {recipe: progress.id}}" class="link">
          <font-awesome-icon :icon="['fal', 'chevron-left']" /> recipe details
        </router-link>
        <h4 v-if="selectedRecipe">{{selectedRecipe.details.name}}</h4>
      </div>
      <router-link :to="{ name: 'recipe', params: {recipe: progress.id}}" class="recipe-name link" v-if="selectedRecipe">
        <font-awesome-icon :icon="['fal', 'chevron-left']" /> {{selectedRecipe.details.name}}
      </router-link>
      <div class="info serving-time" v-if="selectedRecipe">
        <font-awesome-icon :icon="['fal', 'utensils']" />
        <span>Serving at {{servingTime}}</span>
      </div>
      <div class="image" :style="selectedRecipe.details.imageStyle" v-if="selectedRecipe"></div>
      <div v-if="dev" id="cook-control-testing">
        <span :class="{'badge-dark': timerShown}" class="badge badge-pill">timerShown</span>
        <span :class="{'badge-dark': stepShown}" class="badge badge-pill">stepShown</span>
        <span :class="{'badge-dark': notFirstStep}" class="badge badge-pill">notFirstStep</span>
        <span :class="{'badge-dark': mustFinishTimer}" class="badge badge-pill">mustFinishTimer</span>
        <span :class="{'badge-dark': showServedButton}" class="badge badge-pill">showServedButton</span>
        <span :class="{'badge-dark': showNextButton}" class="badge badge-pill">showNextButton</span>
        <span :class="{'badge-dark': showBackToTimer}" class="badge badge-pill">showBackToTimer</span>
        <span :class="{'badge-dark': showHideTimer}" class="badge badge-pill">showHideTimer</span>
      </div>
    </div>
    <div class="current-step" ref="current-step" v-hammer:swipe="onSwipe">
      <div class="step-control prev">
        <button ref="hide-timer" class="btn secondary" @click="progress.timer.show = false">
          <font-awesome-icon :icon="['fal', 'times']" />
        </button>
        <button ref="back-arrow" class="btn secondary" @click="changeStep(-1);">
          <font-awesome-icon :icon="['fal', 'arrow-left']" />
        </button>
      </div>
      <div class="step-control next" v-if="selectedRecipe">
        <button ref="close-timer" class="btn primary" @click="closeTimer()">
          <font-awesome-icon :icon="['fal', 'check']" />
        </button>
        <button ref="forward-arrow" class="btn primary" @click="changeStep(1);">
          <font-awesome-icon :icon="['fal', 'arrow-right']" v-if="!selectedRecipe.steps[progress.currentStep].parallel || currentlyTiming" />
          <font-awesome-icon :icon="['fal', 'stopwatch']" v-if="selectedRecipe.steps[progress.currentStep].parallel && !currentlyTiming" />
        </button>
        <button ref="back-link" class="back btn link" @click="progress.timer.show = true;">
          Back to step {{progress.timer.step + 1}}
        </button>
        <button ref="served-button" class="btn link" @click="finishCooking();">
          <font-awesome-icon :icon="['fal', 'utensils']" />
        </button>
      </div>
      <div class="step-description" v-if="selectedRecipe">
        <div :style="currentStepStyle(index)" v-for="(step, index) in selectedRecipe.steps" :key="index" ref="step-description">
          {{step ? step.description : ''}}
        </div>
        <div :style="currentStepStyle(null)" ref="timer-description">
          {{selectedRecipe.steps[progress.timer.step] ? selectedRecipe.steps[progress.timer.step].description : ''}}
        </div>
      </div>
      <form class="info adjust-timer" v-if="timerShown && selectedRecipe">
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
      <div class="countdown" :class="{'timer-container': !progress.timer.show, 'method-progress': progress.timer.show}" v-if="progress.timer.step !== null">
        <timer :current-progress="progress" :mode="progress.timer.step !== null && progress.timer.show ? 'text' : 'button'" class="shown" />
      </div>
      <div class="method-progress" v-if="!progress.timer.show && selectedRecipe">
        <div>{{progress.currentStep+1}} of {{selectedRecipe.steps.length}}</div>
        <div class="key-guide">
          <font-awesome-icon :icon="['fal', 'chevron-left']" />
          <font-awesome-icon :icon="['fal', 'keyboard']" />
          <font-awesome-icon :icon="['fal', 'chevron-right']" />
        </div>
      </div>
    </div>

    <button class="ingredients-btn btn link"
      v-if="selectedRecipe"
      @click="toggleIngredients($event)"
      :class="{'shown': selectedRecipe.steps[progress.currentStep].ingredientsUsed.length > 0 && !progress.timer.show}">
      <span class="count">{{selectedRecipe.steps[progress.currentStep].ingredientsUsed.length}} ingredient{{selectedRecipe.steps[progress.currentStep].ingredientsUsed.length === 1 ? '' : 's'}} used</span>
      <span class="no-count">ingredients</span>
      <span class="badge key-guide">
        <font-awesome-icon :icon="['fal', 'keyboard']" /> i
      </span>
    </button>
    <div class="ingredients-used" ref="ingredients-used" v-if="selectedRecipe"
          v-bind:class="{'shown': showIngredients}"
          @click="toggleIngredients($event)">
      <div ref="ingredients-panel" class="ingredients-panel">
        <div class="ingredients">
          <h5>Used in this step:</h5>
          <div class="ingredient" v-for="(ingredient, index) in selectedRecipe.steps[progress.currentStep].ingredientsUsed" v-bind:key="index">
            <div class="name">{{findIngredient(ingredient, selectedRecipe).description}}</div>
            <div class="description">
              <div class="badge badge-light">{{ingredient.quantity}} {{findIngredient(ingredient, selectedRecipe).unit}}</div>
              <div v-if="findIngredient(ingredient, selectedRecipe).preparation">
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
import recipeTest from '@/components/recipe-test.vue';

export default {
  name: 'cook',
  mixins: [mixins],
  components: {
    timer,
    recipeTest
  },
  data: function(){
    return {
      moment: moment,
      showIngredients: false,
      timeToAdd: 0,
      timeAdjusted: false,
      offsetStepDescription: null,
      checkTimeLeft: undefined,
      watchingTimer: false,
      notFirstStep: false,
      mustFinishTimer: false,
      showServedButton: false,
      showNextButton: false,
      showHideTimer: false
    };
  },
  computed: {
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    timerShown: function(){
      var timerShown = this.progress.timer.step !== null && this.progress.timer.show;
      return timerShown;
    },
    stepShown: function(){
      var stepShown = this.progress.timer.step === null || (this.progress.timer.step !== null && !this.progress.timer.show);
      return stepShown;
    },
    showNext: function(){
      if(!this.selectedRecipe) return false;
      var notLast = this.progress.currentStep < this.selectedRecipe.steps.length - 1;
      var step = this.selectedRecipe.steps[this.progress.currentStep];
      var hasDependency = step.dependsOn !== null && step.dependsOn === this.progress.timer.step
      return (notLast && !hasDependency) || step.parallel;
    },
    showBackToTimer: function(){
      if(this.selectedRecipe){
        var dependentStep = this.progress.timer.step !== null && this.selectedRecipe.steps[this.progress.currentStep].dependsOn === this.progress.timer.step;
        return !this.showNext && dependentStep;
      }else{
        return false;
      }
    }
  },
  methods: {
    changeStep: function(direction){
      var that = this;

      var notParallel = !that.selectedRecipe.steps[that.progress.currentStep].parallel;
      var firstStep = that.progress.currentStep === 0;
      var lastStep = that.progress.currentStep == that.selectedRecipe.steps.length-1;

      if(that.showBackToTimer && direction == 1){
        that.progress.timer.show = true;
        return;
      }
      if(firstStep && direction === -1) return;
      if(lastStep && direction == 1 && notParallel) return;

      if(direction === 0) return;

      if(that.selectedRecipe.steps[that.progress.currentStep].parallel && direction === 1){
        if(that.timerShown){
          that.$store.commit('setDialogMessage', { text: 'Are you sure you are finished timing step ' + (that.progress.timer.step+1) + '?', proceed: function(){
            that.setTimer();
            continueStepChange();
          }});
        }else{
          if(that.progress.timer.step !== null){
            that.$store.commit('setUserMessage', { text: 'Make sure you are finished timing step ' + (that.progress.timer.step+1) + ' first.', type: 'text-warning'});
            that.progress.timer.show = true;
          }else{
            that.setTimer();
            continueStepChange();
          }
        }
      }else{
        continueStepChange();
      }

      function continueStepChange(){
        if(!lastStep || (lastStep && notParallel)) that.progress.currentStep += direction;
        else that.progress.timer.show = true;

        setTimeout(function(){
          that.showIngredients = false;
        }, 150);
      }
    },
    finishCooking: function(){
      console.log('finishCooking');
    },
    currentStepStyle: function(step){
      var currentStep = this.timerShown ? this.progress.timer.step : step;
      var offset = this.timerShown ? 0 : step - this.progress.currentStep;

      if(currentStep === null || !this.selectedRecipe) return {display: 'none'};
      if(this.timerShown && step !== currentStep) return {display: 'none'};

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
        display: 'block',
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
      if(this.selectedRecipe.steps[this.progress.timer.step].duration < -this.progress.timer.timeAdded+2 && adjust == -1) return;
      this.progress.timer.timeAdded += adjust;
      this.timeAdjusted = true;
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
      }});
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
      if(selectedRecipe){
        this.calcServingTime(selectedRecipe, 'time', true);
        var loading = this.$refs['loading'];
        Velocity(loading, { opacity: 0 }, { display: 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);
      }
    },
    progress: {
      handler: function (progress) {
        var that = this;
        localStorage.setItem('progress', JSON.stringify(progress));
        that.$store.commit('setProgress', progress);

        if(progress.timer.step === null) clearInterval(that.checkTimeLeft);

        check();

        function check(){
          if(that.selectedRecipe){
            that.calcServingTime(that.selectedRecipe, 'time', true);
            animate();
          }else{
            setTimeout(function(){
              check();
            }, 100);
          }
        }

        function animate(){
          var backArrow = that.$refs['back-arrow'];

          var forwardArrow = that.$refs['forward-arrow'];
          var backLink = that.$refs['back-link'];
          var servedButton = that.$refs['served-button'];

          var hideTimer = that.$refs['hide-timer'];
          var closeTimer = that.$refs['close-timer'];

          var notFirstStep = that.notFirstStep;
          var mustFinishTimer = that.mustFinishTimer;
          var showServedButton = that.showServedButton;
          var showNextButton = that.showNextButton;
          var showHideTimer = that.showHideTimer;
          var timeAdjusted = that.clone(that.timeAdjusted);
          that.timeAdjusted = false;

          that.notFirstStep = progress.currentStep > 0 && that.stepShown;
          that.mustFinishTimer = that.showBackToTimer && that.stepShown;
          that.showServedButton = that.stepShown && progress.currentStep === that.selectedRecipe.steps.length - 1 && !that.showBackToTimer && !that.selectedRecipe.steps[progress.currentStep].parallel;
          that.showNextButton = that.showNext && that.stepShown;
          that.showHideTimer = that.timerShown;

          if(notFirstStep !== that.notFirstStep) Velocity(backArrow, { opacity: that.notFirstStep ? 1 : 0 }, { display: that.notFirstStep ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);

          if(showNextButton !== that.showNextButton) Velocity(forwardArrow, {opacity: that.showNextButton ? 1 : 0 }, { display: that.showNextButton ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);
          if(mustFinishTimer !== that.mustFinishTimer) Velocity(backLink, { opacity: that.mustFinishTimer ? 1 : 0 }, { display: that.mustFinishTimer ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);
          if(showServedButton !== that.showServedButton) Velocity(servedButton, { opacity: that.showServedButton ? 1 : 0 }, { display: that.showServedButton ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);

          if(showHideTimer !== that.showHideTimer) Velocity(hideTimer, { opacity: that.showHideTimer ? 1 : 0 }, { display: that.showHideTimer ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);
          if(!timeAdjusted) Velocity(closeTimer, { opacity: that.timerShown ? 1 : 0 }, { display: that.timerShown ? 'block' : 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);

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
      var currentStep = that.$refs['current-step'];
      var manager = that.$refs['manager'];
      if(currentStep && manager){
        Velocity(currentStep, { opacity: 1 }, { delay: 300, easing: 'easeInQuad' }, 150);
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
  grid-row-start: 2;
  background-color: #efefef;
  overflow-y: hidden;
  overflow-x: hidden;
  .screen-sm-min({
    grid-template-columns: 300px auto;
    grid-template-rows: 100%;
  });
  .manager {
    position: fixed;
    left: -100px;
    right: 0;
    grid-row-start: 1;
    grid-column: 1/2;
    align-self: start;
    justify-items: end;
    color: #fff;
    background-color: #333;
    height: 74px;
    padding: 0 20px;
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
        padding: 15px 20px;
        background-color: #cccccc1c;
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
  .loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    padding: 25%;
    font-size: 5em;
    background-color: #e7e7e7;
    z-index: 2;
  }
  .current-step {
    position: relative;
    grid-row-start: 1;
    display: grid;
    height: 100%;
    grid-template-rows: 150px auto;
    text-align: center;
    align-items: center;
    opacity: 0;
    .screen-xs-max({
      grid-row-start: 2;
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
      > .btn {
        height: 80px;
        width: 80px;
        font-size: 1.6em;
        opacity: 0;
        display: none;
        position: absolute;
        top: 0;
        .screen-sm-min({
          height: 120px;
          width: 120px;
          font-size: 2.5em;
        });
        > svg {
          width: 1em;
          margin-right: 0;
          vertical-align: top;
        }
      }
      &.prev {
        justify-self: start;
        margin: 0;
        > .btn {
          left: 0;
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
        margin: 0;
        > .btn {
          right: 0;
          text-align: right;
          padding: 0 30px 0 0;
          border-radius: 0 0 0 100%;
          border-width: 0 0 3px 3px;
          .screen-xs-max({
            padding: 0 20px 0 0;
          });
          &.back {
            font-size: 1em;
            line-height: 1.2;
            text-align: center;
          }
          &.served-button {
            font-size: 1em;
            line-height: 1.2;
            text-align: center;
          }
          &.link {
            height: auto;
            padding: 25px;
            .screen-xs-max({
              padding: 20px;
              width: 120px;
              font-size: 0.8em;
            });
            > svg {
              font-size: 1.5em;
              .screen-xs-max({
                font-size: 2.2em;
              });
            }
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
    .timer-container {
      grid-row-start: 3;
      align-self: end;
      justify-self: end;
      margin: 0 30px 30px 0;
      z-index: 1;
      .screen-xs-max({
        margin: 0 20px 20px 0;
      });
      &.text {
        margin: 0;
      }
      > button {
        border-bottom: none !important;
      }
    }
    .method-progress {
      width: 120px;
      margin-top: 25px;
      align-self: start;
      justify-self: center;
      grid-row-start: 1;
      grid-column-start: 1;
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
        .screen-xs({
          grid-template-columns: 1fr 1fr 1fr;
        });
        .screen-xxs-max({
          grid-template-columns: 1fr 1fr;
        });
        .screen-tiny({
          grid-template-columns: 1fr;
        });
        > h5 {
          grid-row: 1/2;
          grid-column: 1/6;
          margin-bottom: 0;
          .screen-xs({
            grid-column: 1/4;
          });
          .screen-xxs-max({
            grid-column: 1/3;
          });
          .screen-tiny({
            grid-column: 1/2;
          });
        }
        > .ingredient {
          display: inline-block;
          height: 100%;
          border: 1px solid #ccc;
          text-align: center;
          &:nth-child(2), &:nth-child(7) { .name {background-color: @purple; } }
          &:nth-child(3), &:nth-child(8) { .name {background-color: @red; } }
          &:nth-child(4), &:nth-child(9) { .name { background-color: @brown; } }
          &:nth-child(5), &:nth-child(10) { .name {background-color: @yellow; } }
          &:nth-child(6), &:nth-child(11) { .name {background-color: @green; } }
          > div {
            &.name {
              padding: 5px 10px;
              border-bottom: 2px solid #999;
              font-weight: 400;
              color: #fff;
            }
            &.description {
              padding: 10px;
              font-size: 1em;
              line-height: 1.2;
              > .badge {
                margin-bottom: 10px;
                border-radius: 0;
              }
            }
          }
        }
      }
    }
  }
}

#cook-control-testing {
  padding: 15px;
  text-align: center;
  > span {
    font-size: 0.8em;
    font-weight: 400;
  }
}
</style>
