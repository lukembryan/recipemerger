<template>
  <div class="timer" v-bind:class="{'text': mode == 'text'}">
    <button class="btn secondary" @click="timer.show = true;" v-if="mode == 'button'">
      <span class="step">Step </span>
      <span>{{timer.step + 1}}</span>
      <font-awesome-icon :icon="['fal', 'stopwatch']" />
      <span>{{timeLeft}}</span>
    </button>
    <div v-if="mode == 'text'">
      <div>Step {{timer.step + 1}}</div>
      <font-awesome-icon :icon="['fal', 'stopwatch']" />
      <span>{{timeLeft}}</span>
    </div>
  </div>
</template>

<script>
import mixins from '@/mixins.js';

export default {
  name: 'timer',
  mixins: [mixins],
  props: {
    timer: Object,
    mode: String
  },
  data: function(){
    return {
      checkTimeLeft: undefined,
      timeLeft: '0:00'
    };
  },
  computed: {},
  methods: {
    countDown: function(){
      var that = this;
      that.checkTimeLeft = setInterval(function(){
        that.timeLeft = that.showHoursMinutesSeconds(that.calcTimeLeft(that.timer));
      }, 1000);
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
  created: function(){
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
  }
  > button {
    opacity: 0;
    text-transform: uppercase;
    cursor: pointer;
    transition: all ease-in-out 0.3s;
    .screen-sm-min({
      margin: 0 20px;
      width: 260px;
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
