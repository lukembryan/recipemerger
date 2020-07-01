<template>
  <div class="recipe-test" :class="{'hidden': !show}" v-if="selectedRecipe">
    <button :style="{fontSize: (scrolledDown || page == 'cook' ? 1 : 1.3) + 'em', lineHeight: (scrolledDown || page == 'cook' ? 40 : 55) + 'px'}" class="btn tertiary" @click="show = !show">
      <font-awesome-icon :icon="['fal', (show ? 'times' : 'vial')]" />
    </button>
    <div ref="panel">
      <span class="float-right">ServingTime  <strong>{{servingTimePrint}}</strong></span>
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
        <div class="progress-line" :style="progressLineStyle()">
          <span class="badge badge-dark badge-sm">{{currentTime}}</span>
        </div>
        <div class="minutes total">
          <span :style="'width:' + (1/recipeDuration)*100 + '%;'" v-for="min in recipeDuration" :key="min">
            <span style="position: absolute; top: 0;" class="number" v-if="showOnScale(min-1)">{{min-1}}</span>
          </span>
          <span style="float: right; border: none;">
            <span style="position: absolute; top: 0;" class="number">{{recipeDuration}}</span>
          </span>
        </div>
        <div class="step" v-for="(step, index) in selectedRecipe.steps" :key="index" :class="{'current': page === 'cook' && progress.currentStep === index}">
          <div class="setup-duration" :style="timelineStepStyle(step, index, 'setupDuration')" v-if="step.parallel" :title="'setup: ' + step.setupDuration">
            {{step.setupDuration ? index+1 : ''}}
            <div class="minutes"><span :style="'width:' + (1/step.setupDuration)*100 + '%;'" v-for="min in step.setupDuration-1" :key="min"></span></div>
          </div>
          <div class="duration" :style="timelineStepStyle(step, index, 'duration')" :title="'duration: ' + step.duration">
            {{!step.setupDuration ? index+1 : ''}}
            <div class="minutes"><span :style="'width:' + (1/(step.duration + (progress.timer.timeAdded < 0 && index === progress.timer.step ? progress.timer.timeAdded : 0))*100) + '%;'" v-show="progress.timer.step !== index || min < (step.duration + progress.timer.timeAdded)" v-for="min in step.duration-1" :key="min"></span></div>
          </div>
          <div class="time-added" :style="timelineStepStyle(step, index, 'timeAdded')" :class="{'removed': progress.timer.timeAdded < 0}" :title="'time ' + (progress.timer.timeAdded >= 0 ? 'added' : 'removed') + ': ' + Math.abs(progress.timer.timeAdded)" v-if="progress.timer.step === index && progress.timer.timeAdded">
            <div class="minutes"><span :style="'width:' + (1/Math.abs(progress.timer.timeAdded))*100 + '%;'" v-for="min in Math.abs(progress.timer.timeAdded-1)" :key="min"></span></div>
          </div>
        </div>
        <div class="minutes total">
          <span :style="'width:' + (1/recipeDuration)*100 + '%;'" v-for="min in recipeDuration" :key="min">
            <span style="position: absolute; bottom: -16px;" class="number" v-if="showOnScale(min-1)">{{min-1}}</span>
          </span>
          <span style="float: right; border: none;">
            <span style="position: absolute; bottom: -16px;" class="number">{{recipeDuration}}</span>
          </span>
        </div>
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
      currentTime: moment().format('h:mm')
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
    }
  },
  methods: {
    moment: moment,
    timelineStepStyle: function(currentStep, stepIndex, component){
      var total = this.recipeDuration;
      var offset = this.clone(this.stepOffsets[stepIndex]);
      var timingStep = this.progress.timer.step !== null;
      var timeAdded = timingStep ? this.progress.timer.timeAdded : 0;
      var width = component === 'timeAdded' ? Math.abs(timeAdded) : this.clone(currentStep[component]);

      if(component === 'duration'){
        if(currentStep.parallel) offset = 0;
      }

      if(component === 'timeAdded') offset = 0;

      if(component === 'duration' && timingStep && this.progress.timer.step === stepIndex){
        if(this.progress.timer.timeAdded < 0) width += timeAdded;
      }

      var styles = {
        width: (width/total)*100 + '%',
        marginLeft: (offset/total)*100 + '%'
      };

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

      return styles;
    },
    progressLineStyle: function(){
      var total = this.recipeDuration;
      var offset = this.clone(this.stepOffsets[this.progress.currentStep]);;

      var styles = {
        marginLeft: (offset/total)*100 + '%'
      };

      return styles;
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
      margin: 50px 0 15px;
      .step {
        margin: 5px 0;
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
          > span {
            border-right: 1px solid black;
            text-align: left;
            &:first-child {
              border-left: 1px solid black;
            }
            > .number {
              margin: -3px 4px 0 -4px;
              font-size: 0.5em;
              width: 10px;
            }
          }
        }
        > span {
          display: inline-block;
          height: 5px;
          border-right: 1px solid white;
        }
      }
      .progress-line {
        position: absolute;
        top: -30px;
        bottom: 5px;
        left: 0;
        border-left: 1px solid;
        z-index: 1;
        > .badge {
          position: absolute;
          top: -10px;
          margin-left: -1px;
          border-radius: 0;
          font-size: 0.7em;
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
