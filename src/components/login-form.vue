<template>
  <div id="login-form" v-bind:class="{'is-admin': isAdmin}">
    <span id="logout" class="link" @click="logOut()" v-if="isAdmin">log out</span>
    <form name="loginForm" v-on:submit="submit" v-if="!isAdmin">
      <div class="form-group">
        <label>Email</label>
        <input class="form-control" type="email" name="email" v-model="credentials.email" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input class="form-control" type="password" name="password" v-model="credentials.password" />
      </div>
      <div class="form-field">
        <button class="btn btn-primary" type="submit">Submit</button>
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
      fb.auth.signInWithEmailAndPassword(this.credentials.email, this.credentials.password).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
      });
    },
    logOut: function(){
      fb.auth.signOut().then(function() {
        console.log('logged out');
        // Sign-out successful.
      }).catch(function(error) {
        console.log('not logged out', error);
        // An error happened.
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
  form {}
}
</style>
