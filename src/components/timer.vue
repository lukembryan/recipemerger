<template>
  <div class="timer" v-bind:class="{'text': mode == 'text'}">
    <div class="message" v-if="mode == 'button' && dependsOn">Complete this step first</div>
    <div class="message" v-if="mode == 'button' && nowTiming">Currently timing this step</div>
    <button class="btn primary" @click="currentProgress.timer.show = true;" v-if="currentProgress && mode == 'button'">
      <span class="step">Step </span>
      <span>{{currentProgress.timer.step + 1}}</span>
      <font-awesome-icon :icon="['fal', 'stopwatch']" />
      <span>{{timeLeft}}</span>
    </button>
    <div v-if="currentProgress && mode == 'text'">
      <div>Step {{currentProgress.timer.step + 1}}</div>
      <font-awesome-icon :icon="['fal', 'stopwatch']" />
      <span>{{timeLeft}}</span>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import mixins from '@/mixins.js';

export default {
  name: 'timer',
  mixins: [mixins],
  props: {
    currentProgress: Object,
    mode: String
  },
  data: function(){
    return {
      alarm: undefined,
      checkTimeLeft: undefined,
      timeLeft: '...'
    };
  },
  computed: {
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    dependsOn: function(){
      return this.currentProgress && this.selectedRecipe.steps[this.currentProgress.currentStep].dependsOn === this.currentProgress.timer.step;
    },
    nowTiming: function(){
      return this.currentProgress && this.currentProgress.currentStep === this.currentProgress.timer.step;
    }
  },
  methods: {
    moment: moment,
    countDown: function(){
      var that = this;
      that.alarm = new Audio(require('../assets/alarm.mp3'));
      that.checkTimeLeft = setInterval(function(){
        if(that.currentProgress){
          var timeLeft = that.calcTimeLeft(that.currentProgress.timer);
          if(timeLeft === 0) that.timerAlarm();
          that.timeLeft = that.showHoursMinutesSeconds(timeLeft);
        }
      }, 1000);
    },
    timerAlarm: function(){
      var that = this;

      if(that.alarm && !that.alarm.paused) return;

      console.log('play');

      that.alarm.play();

      that.$store.commit('setDialogMessage', {
        text: 'Timer has finished, add time?',
        proceed: function(){
          that.stopAlarm();
          var minutesSoFar = that.currentProgress.timer.duration + that.currentProgress.timer.timeAdded;
          var minutesSinceStart = moment().diff(that.currentProgress.timer.started, 'seconds')/60;
          var adjustment = Math.ceil(minutesSinceStart - minutesSoFar) + 1;
          that.currentProgress.timer.timeAdded = parseInt(that.currentProgress.timer.timeAdded) + adjustment;
        },
        cancel: function(){
          that.stopAlarm();
          that.currentProgress.timer = {
            step: null,
            duration: 0,
            started: null,
            timeAdded: 0,
            show: false
          };
        }
      });

      that.currentProgress.timer.show = true;
    },
    stopAlarm: function(){
      if(this.alarm) this.alarm.pause();
    },
    showHoursMinutesSeconds: function(totalSeconds) {
      if(totalSeconds <= 0){
        return 'ready';
      }else{
        var totalMinutes = totalSeconds / 60;
        var hours = Math.floor(totalMinutes / 60);
        var minutes = Math.floor(totalMinutes % 60);
        var seconds = Math.floor((totalSeconds - (minutes * 60)) % (60 * 60));
        var time = '';

        if(!isNaN(seconds)){
          if(hours > 0) time += (hours < 10 ? '0' : '') + hours + ':';
          time += (minutes < 10 && hours > 0 ? '0' : '') + minutes + ':';
          time += (seconds < 10 ? '0' : '') + seconds;
        }
        return time;
      }
    }
  },
  mounted: function(){
    this.countDown();
  },
  beforeDestroy: function(){
    clearInterval(this.checkTimeLeft);
    this.checkTimeLeft = undefined;
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.timer {
  text-align: center;
  &:not(.text){
    margin-top: 20px;
    .screen-xs-max({
      margin-top: 0;
    });
  }
  &.shown {
    > button {
      opacity: 1;
    }
    > .message {
      opacity: 1;
    }
  }
  > .message {
    opacity: 0;
    margin-bottom: 5px;
    transition: all ease-in-out 0.3s;
  }
  > button {
    opacity: 0;
    text-transform: uppercase;
    cursor: pointer;
    transition: all ease-in-out 0.3s;
    .screen-sm-min({
      font-size: 1.2em;
    });
    > svg {
      margin-left: 15px;
    }
  }
  > div {
    > div {
      font-size: 0.7em;
      margin-bottom: 10px;
    }
  }
  svg {
    margin-right: 10px;
  }
}
</style>
