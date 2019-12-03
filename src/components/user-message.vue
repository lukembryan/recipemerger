<template>
  <div class="user-message" v-if="message.text.length > 0">
    <font-awesome-icon :icon="['fal', icon]" v-bind:class="message.type" />
    <div class="message">{{message.text}}</div>
    <div class="link" v-if="['text-warning', 'text-danger'].indexOf(message.type) >= 0" @click="closeMessage()">OK</div>
  </div>
</template>

<script>
export default {
  name: 'user-message',
  data: function(){
    return {};
  },
  computed: {
    message: function(){
      return this.$store.state.userMessage;
    },
    icon: function(){
      var icons = {
        'text-info': 'sync-alt',
        'text-success': 'check',
        'text-warning': 'exclamation',
        'text-danger': 'times'
      };
      return icons[this.message.type];
    }
  },
  methods: {
    closeMessage: function(){
      this.$store.commit('setUserMessage', { text: '', type: '' });
    }
  },
  watch: {
    message: function (message) {
      var closeMessage = this.closeMessage;
      setTimeout(function(){
        if(message.type == 'text-success') closeMessage();
      }, 2000);
    }
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.user-message {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 20% 10%;
  background-color: #000000AA;
  text-align: center;
  font-size: 1.3em;
  z-index: 2;
  > svg {
    font-size: 2em;
    &.text-info {
      -webkit-animation: rotation 2s infinite linear;
      animation: rotation 2s infinite linear;
    }
  }
  > div.message {
    margin-top: 15px;
    color: #fff;
  }
  > div.link {
    margin-top: 25px;
  }
}
</style>
