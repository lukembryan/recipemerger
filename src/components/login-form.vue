<template>
  <div id="login-form" v-bind:class="{'is-admin': isAdmin}">
    <span id="logout" class="link" @click="logOut()" v-if="isAdmin">
      <font-awesome-icon :icon="['fal', 'sign-out']" /> log out
    </span>
    <form name="loginForm" v-on:submit="submit" v-if="!isAdmin">
      <div class="form-field">
        <label>Email</label>
        <input class="form-control" type="email" name="email" v-model="credentials.email" />
      </div>
      <div class="form-field">
        <label>Password</label>
        <input class="form-control" type="password" name="password" v-model="credentials.password" />
      </div>
      <div class="form-field">
        <button class="link btn btn-text" type="submit">
          <font-awesome-icon :icon="['fal', 'sign-in']" /> log in
        </button>
      </div>
    </form>
  </div>
</template>

<script>
const fb = require('../firebase.js');

export default {
  name: 'login-form',
  props: {
    isAdmin: Boolean
  },
  data: function(){
    return {
      credentials: {
        email: '',
        password: ''
      }
    };
  },
  computed: {},
  methods: {
    submit: function(e){
      e.preventDefault();
      var that = this;
      this.$store.commit('setUserMessage', { text: 'signing in', type: 'text-info' });
      fb.auth.signInWithEmailAndPassword(this.credentials.email, this.credentials.password).then(function() {
        that.$store.commit('setUserMessage', { text: 'logged in!', type: 'text-success' });
      }).catch(function(error) {
        console.log(error);
        that.$store.commit('setUserMessage', { text: 'issue logging in', type: 'text-danger' });
      });
    },
    logOut: function(){
      var that = this;
      this.$store.commit('setUserMessage', { text: 'logging out', type: 'text-info' });
      fb.auth.signOut().then(function() {
        that.$store.commit('setUserMessage', { text: 'successfully logged out', type: 'text-success' });
      }).catch(function(error) {
        console.log(error);
        that.$store.commit('setUserMessage', { text: 'issue logging out', type: 'text-danger' });
      });
    }
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

#login-form {
  &.is-admin {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  form {
    width: 250px;
  }
}
</style>
