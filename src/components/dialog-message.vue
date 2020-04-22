<template>
  <div class="dialog-message" v-if="message.text.length > 0">
    <div class="message">{{message.text}}</div>
    <div class="buttons">
      <button class="btn secondary" @click="cancel()">Cancel</button>
      <button class="btn primary" @click="proceed()">OK</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'dialog-message',
  data: function(){
    return {};
  },
  computed: {
    message: function(){
      return this.$store.state.dialogMessage;
    }
  },
  methods: {
    proceed: function(){
      this.message.proceed();
      this.$store.commit('setDialogMessage', { text: '', proceed: null });
    },
    cancel: function(){
      if(this.message.cancel) this.message.cancel();
      this.$store.commit('setDialogMessage', { text: '', proceed: null });
    }
  },
  watch: {}
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.dialog-message {
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
  > .message {
    margin-top: 15px;
    color: #fff;
  }
  > .buttons {
    margin-top: 25px;
    > button {
      margin: 0 10px;
    }
  }
}
</style>
