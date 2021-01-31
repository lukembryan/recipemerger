<template>
  <div class="recipe-test" :class="{'hidden': !show}" v-if="selectedRecipe">
    <button :style="{fontSize: (scrolledDown || page == 'cook' ? 1 : 1.3) + 'em', lineHeight: (scrolledDown || page == 'cook' ? 40 : 55) + 'px'}" class="btn tertiary" @click="show = !show">
      <font-awesome-icon :icon="['fal', (show ? 'times' : 'vial')]" />
    </button>
    <div ref="panel">
      <span class="float-right">Serving Time:  <strong>{{servingTimePrint}}</strong></span>
      <h4>{{selectedRecipe.details.name}}</h4>
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <span class="nav-link link" :class="{'active': active == 'details'}" @click="active = 'details'">Details</span>
        </li>
        <li class="nav-item">
          <span class="nav-link link" :class="{'active': active == 'timeline'}" @click="active = 'timeline'">Timeline</span>
        </li>
        <li class="nav-item">
          <span class="nav-link link" :class="{'active': active == 'variables'}" @click="active = 'variables'">Variables</span>
        </li>
      </ul>
      <div class="alert alert-info text-center">
        Duration
        <font-awesome-icon :icon="['fal', 'stopwatch']" />
        <strong style="margin-left: 5px;">{{showHoursMinutes(recipeDuration)}}</strong>
      </div>
      <div class="details" v-if="active === 'details' && selectedRecipe">
        <div class="steps">
          <div v-for="(step, index) in this.selectedRecipe.steps" :key="index" :class="{'current': page === 'cook' && progress.currentStep === index}">
            <strong style="text-align: center; text-decoration: underline;">{{index+1}}</strong>
            <div>
              {{step.description}}
            </div>
            <span>
              <span v-show="step.setupDuration">Setup <strong>{{step.setupDuration}}</strong> min</span>
            </span>
            <span>
              Duration <strong>{{step.duration}}</strong> min
            </span>
            <span>
              <span v-if="step.parallel">Parallel</span>
            </span>
            <span>
              <span v-if="step.dependsOn !== null">Depends On <strong>{{step.dependsOn+1}}</strong></span>
            </span>
            <span>
              <span v-if="step.ingredientsUsed.length > 0">Ingredients <strong>{{step.ingredientsUsed.length}}</strong></span>
            </span>
          </div>
        </div>
      </div>
      <div class="timeline" v-if="active === 'timeline' && selectedRecipe">
        <div class="progress-line" :style="progressLineStyle">
          <div class="badge badge-dark badge-sm">{{currentTime}}<br />-{{timeLeft}}</div>
        </div>
        <div class="minutes total top">
          <span :style="'width:' + (1/recipeDuration)*100 + '%;'" v-for="min in reversedMinutes" :key="min">
            <span style="position: absolute; top: 0;" class="number" v-if="showOnScale(min-1)">{{min-1}}</span>
          </span>
          <span style="float: left; border: none;">
            <span style="position: absolute; top: 0;" class="number last">{{recipeDuration}}</span>
          </span>
        </div>
        <div class="step" v-for="(step, index) in selectedRecipe.steps" :key="index" :class="{'current': page === 'cook' && progress.currentStep === index}">
          <div class="setup-duration" :style="timelineStepStyle[index].setupDuration" v-if="step.parallel" :title="'setup: ' + step.setupDuration">
            {{step.setupDuration ? index+1 : ''}}
            <div class="minutes"><span :style="'width:' + (1/step.setupDuration)*100 + '%;'" v-for="min in step.setupDuration-1" :key="min"></span></div>
          </div>
          <div class="duration" :style="timelineStepStyle[index].duration" :title="'duration: ' + step.duration">
            {{!step.setupDuration ? index+1 : ''}}
            <div class="minutes"><span :style="'width:' + (1/(step.duration + (progress.timer.timeAdded < 0 && index === progress.timer.step ? progress.timer.timeAdded : 0))*100) + '%;'" v-show="progress.timer.step !== index || min < (step.duration + progress.timer.timeAdded)" v-for="min in step.duration-1" :key="min"></span></div>
          </div>
          <div class="time-added" :style="timelineStepStyle[index].timeAdded" :class="{'removed': timeAdded(index) < 0}" :title="'time ' + (timeAdded(index) >= 0 ? 'added' : 'removed') + ': ' + Math.abs(timeAdded(index))" v-if="showTimeAdded(index)">
            <div class="minutes"><span :style="'width:' + (1/Math.abs(timeAdded(index)))*100 + '%;'" v-for="min in Math.abs(timeAdded(index)-1)" :key="min"></span></div>
          </div>
        </div>
        <div class="minutes total">
          <span :style="'width:' + (1/recipeDuration)*100 + '%;'" v-for="min in reversedMinutes" :key="min">
            <span style="position: absolute; bottom: -16px;" class="number" v-if="showOnScale(min-1)">{{min-1}}</span>
          </span>
          <span style="float: left; border: none;">
            <span style="position: absolute; bottom: -16px;" class="number last">{{recipeDuration}}</span>
          </span>
        </div>
        <p style="margin-top: 20px;">
          <span class="badge badge-light badge-sm" v-for="(offset, step) in stepOffsets">
            {{parseInt(step)+1}} ({{recipeDuration-offset}})
          </span>
        </p>
      </div>
      <div class="variables" v-if="active === 'variables' && selectedRecipe">
        <div>
          <h5>progress</h5>
          <pre>{{progress}}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import moment from 'moment';
import Velocity from 'velocity-animate';

export default {
  name: 'recipe-test',
  mixins: [mixins],
  props: {
    data: Object
  },
  data: function(){
    return {
      show: false,
      active: 'details',
      currentTime: moment().format('h:mm'),
      timeLeft: 0,
      timelineStepStyle: {},
      progressLineStyle: {}
    };
  },
  computed: {
    scrolledDown: function(){
      return this.$store.state.scrolledDown;
    },
    selectedRecipe: function(){
      var selectedRecipe = this.data ? this.data : this.$store.state.selectedRecipe;
      if(selectedRecipe){
        this.calcServingTime(selectedRecipe, 'duration');
        return selectedRecipe;
      }else{
        return null;
      }
    },
    currentStepDelay: function(){
      return this.$store.state.currentStepDelay;
    },
    reversedMinutes: function() {
      var reversedMinutes = [];
      for(var i = this.recipeDuration; i > 0; i--){
        reversedMinutes.push(i);
      }
      return reversedMinutes;
    }
  },
  methods: {
    moment: moment,
    updateStyles: function(){
      var that = this;
      for(var i=0; i<that.selectedRecipe.steps.length; i++){
        var currentStep = that.selectedRecipe.steps[i];
        that.timelineStepStyleSetup(currentStep, i, 'duration');
        if(currentStep.parallel) that.timelineStepStyleSetup(currentStep, i, 'setupDuration');
        if(that.progress.timer.step === i) that.timelineStepStyleSetup(currentStep, i, 'timeAdded');
      }
      that.progressLineStyleSetup();
    },
    timelineStepStyleSetup: function(currentStep, stepIndex, component){
      var total = this.recipeDuration;
      var offset = this.clone(this.stepOffsets[stepIndex]);
      var timingStep = this.progress.timer.step !== null;
      var timeAdded = timingStep ? this.progress.timer.timeAdded : 0;
      //if(stepIndex === this.progress.currentStep && this.currentStepDelay > 0) timeAdded = this.currentStepDelay;
      var width = currentStep[component];

      if(stepIndex === this.progress.currentStep+1) timeAdded += -this.currentStepDelay;

      console.log('this.currentStepDelay', this.currentStepDelay, timeAdded);

      if(component === 'duration'){
        if(currentStep.parallel) offset = 0;
      }

      if(component === 'timeAdded'){
        width = Math.abs(timeAdded);
        offset = 0;
      }

      if(component === 'duration' && timingStep && this.progress.timer.step === stepIndex){
        if(this.progress.timer.timeAdded < 0) width += timeAdded;
      }

      var styles = {
        width: (width/total)*100 + '%',
        marginLeft: (offset/total)*100 + '%'
      };

      /*
      console.log({
        component: component,
        stepIndex: stepIndex,
        timingStep: timingStep,
        width: width,
        offset: offset,
        timeAdded: timeAdded,
        total: total,
        styles: styles,
        timer: this.progress.timer
      });
      */

      if(!this.timelineStepStyle[stepIndex]) this.timelineStepStyle[stepIndex] = {};
      this.timelineStepStyle[stepIndex][component] = styles;
    },
    progressLineStyleSetup: function(){
      var total = this.recipeDuration;
      var offset = this.clone(this.stepOffsets[this.progress.currentStep]);

      var currentStepHistory = this.progress.stepHistory[this.progress.currentStep];
      var stepStartTime = currentStepHistory[currentStepHistory.length-1];
      var lapsedTime = moment().diff(stepStartTime, 'seconds');

      var currentStep = this.selectedRecipe.steps[this.progress.currentStep];
      var timedStep = this.progress.timer.step !== null ? this.selectedRecipe.steps[this.progress.timer.step] : null;
      var stepDuration = currentStep.duration*60;
      var setupDuration = currentStep.setupDuration ? currentStep.setupDuration*60 : false;

      var stepShouldBeDone = lapsedTime > stepDuration;
      var setupShouldBeDone = setupDuration && lapsedTime > setupDuration;
      if(stepShouldBeDone) lapsedTime = stepDuration;
      if(setupShouldBeDone) lapsedTime = setupDuration;

      var pause = stepShouldBeDone || setupShouldBeDone;

      this.timeLeft = -moment().diff(moment(this.servingTimePrint, 'h:mm A'),'minutes');

      var waitingForTimer = currentStep.dependsOn !== null && currentStep.dependsOn == this.progress.timer.step;

      var timerLeft = this.calcTimeLeft(this.progress.timer)/60;
      if(waitingForTimer){
        var fullTimerDuration = this.progress.timer.duration + this.progress.timer.timeAdded + timedStep.setupDuration;
        var timedSoFar = fullTimerDuration - timerLeft;
        var timerOffset = this.clone(this.stepOffsets[currentStep.dependsOn]) + timedSoFar;
        if(timedSoFar > fullTimerDuration) timerOffset = fullTimerDuration;
        offset = timerOffset;
      }else{
        offset += lapsedTime/60;
      }

      var styles = {
        marginLeft: (offset/total)*100 + '%'
      };

      this.progressLineStyle = styles;
    },
    timeAdded: function(stepIndex){
      var timeAdded = 0;
      if(stepIndex == this.progress.currentStep)  timeAdded = this.currentStepDelay;
      else timeAdded = this.progress.timer.timeAdded;
      return timeAdded;
    },
    showTimeAdded: function(stepIndex){
      var addedToTimer = this.progress.timer.step === stepIndex && this.progress.timer.timeAdded;
      var currentStepDelayed = this.progress.currentStep == stepIndex && this.currentStepDelay > 0;
      return addedToTimer || currentStepDelayed;
    },
    showOnScale: function(min){
      var milestone = 1;
      if(this.recipeDuration >= 100) milestone = 5;
      if(min === 0) return true;
      if(min % milestone === 0) return true;
    }
  },
  watch: {
    show: function(show){
      var panel = this.$refs['panel'];
      if(show) Velocity(panel, { marginTop: 0 }, { display: 'block' }, { delay: 0, easing: 'easeInQuad' }, 150);
      else Velocity(panel, { marginTop: '-100%' }, { display: 'none' }, { delay: 0, easing: 'easeInQuad' }, 150);
    }
  },
  created: function(){
    var that = this;
    setInterval(function(){
      that.currentTime = moment().format('h:mm');
      check();

      function check(){
        if(that.selectedRecipe){
          that.updateStyles();
        }else{
          setTimeout(function(){
            check();
          }, 100);
        }
      }
    }, 1000);
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.recipe-test {
  position: absolute;
  z-index: 2;
  width: 100%;
  max-height: 100%;
  overflow-y: scroll;
  -webkit-box-shadow: #333 0px 0px 15px;
  box-shadow: #333 0px 0px 15px;
  &.hidden {
    height: initial;
  }
  > div {
    display: none;
    background: #f7f7f7;
    margin-top: -100%;
    padding: 20px;
    > .nav {
      padding: 0 0 20px;
    }
    > .details {
      > .steps {
        display: grid;
        grid-template-columns: 100%;
        grid-auto-rows: auto;
        font-size: 0.8em;
        > div {
          display: grid;
          grid-template-columns: 20px 3fr 1fr 1fr 1fr 1fr 1fr;
          grid-template-rows: 100%;
          grid-column-gap: 15px;
          border-bottom: 1px dotted #ccc;
          padding: 5px;
          &:last-child {
            border-bottom: none;
          }
          &.current {
            background-color: lighten(@red, 50%);
          }
        }
      }
    }
    > .timeline {
      position: relative;
      padding: 0 3px;
      margin: 50px 35px 15px;
      .step {
        margin: 1px 0;
        font-size: 0.8em;
        &.current {
          > div {
            &.setup-duration {
              background-color: lighten(@red, 25%);
            }
            &.duration {
              background-color: lighten(@red, 10%);
            }
            &.time-added {
              background-color: darken(@red, 5%);
            }
          }
        }
        > div {
          position: relative;
          display: inline-block;
          height: 30px;
          vertical-align: top;
          color: white;
          font-weight: bold;
          &.setup-duration {
            background-color: lighten(@brown, 25%);
          }
          &.duration {
            background-color: lighten(@brown, 10%);
          }
          &.time-added {
            background-color: darken(@brown, 5%);
            &.removed {
              background-color: lighten(@brown, 30%);
            }
          }
        }
      }
      .minutes {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 15px;
        &.total {
          position: relative;
          bottom: 6px;
          &.top {
            > span {
              vertical-align: top;
              margin-top: 10px;
              > .number {
                &.last {
                  margin: -3px 6px 3px -6px;
                }
              }
            }
          }
          > span {
            border-right: 1px solid black;
            text-align: right;
            &:first-child {
              border-left: 1px solid black;
              &:nth-child(5n){
                margin: 5px 0 -5px;
              }
            }
            &:nth-last-child(5n-3){
              height: 10px;
            }
            &:nth-child(5n){
              height: 5px;
            }
            > .number {
              margin: -3px 0 0 -2px;
              &.last {
                margin: 0px 6px 0px -6px;
              }
              font-size: 0.5em;
              width: auto;
              text-align: right;
            }
          }
        }
        > span {
          display: inline-block;
          height: 5px;
          border-right: 1px solid white;
          &:nth-child(5n){
            height: 10px;
          }
        }
      }
      .progress-line {
        position: absolute;
        top: -40px;
        bottom: 52px;
        left: 0;
        border-left: 1px dashed @red;
        z-index: 1;
        > .badge {
          position: absolute;
          top: -3px;
          margin-left: -1px;
          border-radius: 0;
          font-size: 0.7em;
          width: 30px;
          padding: 1px;
        }
      }
    }
    > .variables {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
  > .btn {
    position: fixed;
    top: 0;
    right: 50px;
    line-height: 40px;
    > svg {
      width: 1em;
    }
  }
}
</style>
