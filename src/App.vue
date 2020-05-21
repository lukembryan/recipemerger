<template>
  <div id="layout" :class="page">
    <div class="responsive-test" v-if="dev">
      <span>tiny</span>
      <span>xxs</span>
      <span>xs</span>
      <span>sm</span>
      <span>md</span>
      <span>lg</span>
      <span>xl</span>
    </div>
    <user-message />
    <dialog-message />
    <header v-bind:class="{'compact': scrolledDown || page == 'cook'}" v-if="page != 'home'">
      <h1 v-if="page != 'home'">
        <img src="/img/logo.png" />
        <router-link to="/" @click="toggleMenu()">sizzle</router-link>
      </h1>
      <search v-if="['browse'].indexOf(page) >= 0" />
      <font-awesome-icon :icon="['fal', 'bars']" v-if="page != 'home'" @click="toggleMenu()" ref="toggle" class="link" />
      <div class="menu">
        <div id="menu-container" ref="menu">
          <font-awesome-icon :icon="['fal', 'times']" @click="toggleMenu()" class="link" />
          <ul>
            <li v-for="link in menu" v-bind:class="{'active': link.path == '/' + page}" v-bind:key="link.path">
              <router-link :to="link.path">{{link.label}}</router-link>
            </li>
            <li v-if="isAdmin" v-bind:class="{'active': page == 'admin'}">
              <router-link to="/admin">admin</router-link>
            </li>
          </ul>
        </div>
      </div>
      <div class="overlay" ref="overlay"></div>
    </header>
    <search v-if="['browse'].indexOf(page) >= 0" />
    <router-view />
  </div>
</template>

<script>
import mixins from './mixins.js';
import search from '@/components/search.vue';
import userMessage from '@/components/user-message.vue';
import dialogMessage from '@/components/dialog-message.vue';

import Velocity from 'velocity-animate';

export default {
  name: 'layout',
  mixins: [mixins],
  components: {
    search,
    userMessage,
    dialogMessage
  },
  data: function(){
    return {
      showMenu: false,
      menu: [
        { label: 'browse', path: '/browse' },
        { label: 'cook', path: '/cook' },
        { label: 'how it works', path: '/how-it-works' }
      ]
    };
  },
  computed: {
    scrolledDown: function(){
      return this.$store.state.scrolledDown;
    },
    isAdmin: function(){
      return this.$store.state.user && !this.$store.state.user.isAnonymous;
    },
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    }
  },
  methods: {
    toggleMenu: function(e, state){
      var menu = this.$refs['menu'];
      var overlay = this.$refs['overlay'];
      var toggle = this.$refs['toggle'];
      if(e) e.stopPropagation();
      this.showMenu = state ? state : !this.showMenu;
      if(menu){
        if(this.showMenu) Velocity(menu, { right: 0, opacity: 1 }, { delay: 300, easing: 'easeInQuad' }, 300);
        else Velocity(menu, { right: '-100%', opacity: 0 }, { delay: 300, easing: 'easeInQuad' }, 300);
      }
      if(overlay){
        if(this.showMenu) Velocity(overlay, { opacity: 1, pointerEevents: 'all' }, { delay: 0, easing: 'easeInQuad' }, 300);
        else Velocity(overlay, { opacity: 0, pointerEevents: 'none' }, { delay: 300, easing: 'easeInQuad' }, 300);
      }
      if(toggle){
        if(this.showMenu) Velocity(toggle, { opacity: 0}, { delay: 0, easing: 'easeInQuad' }, 300);
        else Velocity(toggle, { opacity: 1 }, { delay: 0, easing: 'easeInQuad' }, 300);
      }
    },
    updateScroll: function(e){
      this.$store.dispatch('updateScroll', e);
    },
    loadRecipes: function(){
      this.$store.dispatch('loadRecipes');
    }
  },
  watch: {
    $route(to, from){
      if(this.showMenu) this.toggleMenu(null, false);
      this.$store.dispatch('recipeLoaded', to.params.recipe);
      this.$store.dispatch('routeChanged', [from.name, to.name]);
    }
  },
  beforeMount () {
    window.addEventListener('scroll', this.updateScroll);
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.updateScroll);
  }
};
</script>

<style lang="less">
@import 'assets/less/shared.less';

html, body {
  height: 100%;
}

body {
  color: @purple;
  font-size: 16px;
  font-family: 'Titillium Web', sans-serif;
  overflow-x: hidden;
}

.responsive-test {
  position: fixed;
  top: 5px;
  left: 5px;
  background-color: white;
  color: black;
  border: 1px solid #ccc;
  z-index: 3;
  > span {
    display: none;
    padding: 0 1px 2px;
    font-size: 0.8em;
    line-height: 1;
    &:nth-child(1){ .screen-tiny({ display: block; }); }
    &:nth-child(2){ .screen-xxs({ display: block; }); }
    &:nth-child(3){ .screen-xs({ display: block; }); }
    &:nth-child(4){ .screen-sm({ display: block; }); }
    &:nth-child(5){ .screen-md({ display: block; }); }
    &:nth-child(6){ .screen-lg({ display: block; }); }
    &:nth-child(7){ .screen-xl({ display: block; }); }
  }
}

pre {
  white-space: pre-wrap;
  line-height: 1;
  font-size: 0.7em;
}

:focus {
  outline: none;
}

a, .link, button.btn.link {
  color: lighten(@brown, 10%);
  cursor: pointer;
  font-weight: 400;
  &:hover, &:focus {
    text-decoration: none;
    color: lighten(@brown, 20%);
  }
  > svg {
    margin-right: 5px !important;
  }
}

.badge {
  margin: 3px 3px 0 0;
  font-size: 1em;
  &.badge-light {
    border: 1px solid;
  }
  &.badge-dark {
    background-color: @green;
  }
  &.badge-pill {
    padding-right: .45em;
    padding-left: .45em;
  }
  > input.badge-input {
    display: inline;
    width: 60px;
    height: 20px;
    padding: 2px;
    border-radius: 20px 0 0 20px;
    border: 1px solid #aaa;
    text-align: right;
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

h1 {
  display: inline-block;
  grid-column: 1/2;
  margin: -5px 0 0;
  line-height: 0.7;
  font-size: 3em;
  font-family: 'Share', cursive;
  transition: all ease-in-out 0.3s;
  z-index: 0;
  .screen-xs-max({
    width: 170px;
  });
  > a {
    color: lighten(@brown, 20%);
  }
  > img {
    height: 100%;
    margin-right: 10px;
    transition: all ease-in-out 0.3s;
  }
}

h2 {
  font-size: 2em;
}

h3 {
  font-size: 1.7em;
}

h4 {
  margin-bottom: 15px;
  font-size: 1.4em;
}

h5 {
  font-size: 1.2em;
  border-bottom: 1px dotted #ccc;
  padding-bottom: 5px;
  margin-bottom: 15px;
}

h6 {
  font-size: 1em;
  font-weight: bold;
  margin: 20px 0 15px;
}

.warning {
  color: lighten(@red, 25%);
}

.btn {
  border-radius: 0;
  border-width: 3px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  pointer-events: all;
  &:hover, &:focus, &:active, &.active {
    box-shadow: none;
  }
  &.btn-disabled {
    cursor: default;
    color: initial;
    border-color: transparent;
    background-color: transparent;
    pointer-events: none;
  }
  &.primary {
    border: 3px solid @brown;
    color: #fff;
    background-color: lighten(@brown, 10%);
    &:hover, &:focus, &:active, &.active {
      color: #fff;
      background-color: lighten(@brown, 20%);
    }
  }
  &.secondary {
    border: 3px solid lighten(@brown, 40%);
    color: @brown;
    background-color: #fff;
    &:hover, &:focus, &:active, &.active {
      color: lighten(@brown, 10%);
      background-color: lighten(@brown, 55%);
    }
  }
  &.tertiary {
    border: none;
    color: #666;
    background-color: transparent;
    &:hover, &:focus, &:active, &.active {
      color: lighten(#666, 10%);
    }
  }
  &.link {
    border: none;
    color: @brown;
    background-color: transparent;
    &:hover, &:focus, &:active, &.active {
      color: lighten(@brown, 10%);
    }
  }
  > svg {
    margin: 0px 10px 0px 0px;
  }
}

.svg-inline--fa {
  margin: 0px 0 -1px 3px;
}

.bold {
  font-weight: bold !important;
}

.empty {
  text-decoration: center;
  padding: 0 0 15px;
}

.image {
  position: relative;
  background-size: cover;
  background-position: center center;
  width: 100%;
  height: 300px;
}

#layout {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 70px auto;
  height: 100%;
  &.browse {
    .screen-xs-max({
      grid-template-rows: 70px 50px auto;
    });
  }
  &.home {
    > header {
      &.compact {
        background-color: transparent;
      }
    }
  }
  &.cook {
    grid-template-rows: 50px auto;
  }
  > header {
    position: fixed;
    display: grid;
    grid-row: 1/2;
    grid-template-columns: 200px 300px auto 30px;
    grid-template-rows: 100%;
    background-color: #fff;
    padding: 20px;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 70px;
    border-bottom: 1px solid lighten(@brown, 30%);
    transition: all ease-in-out 0.3s;
    box-shadow: #333 0px -10px 15px;
    z-index: 2;
    .screen-xs-max({
      grid-template-columns: auto 30px;
    });
    &.compact {
      padding: 10px 20px;
      height: 50px;
      h1 {
        font-size: 2.4em;
        line-height: 0.9;
        > img {
          height: 85%;
          margin-right: 8px;
        }
      }
      .search {
        font-size: 0.8em;
      }
      .menu {
        svg {
          font-size: 1.6em;
          line-height: 2.5;
          top: 10px;
        }
        #menu-container {
          padding: 40px 20px 0 0;
        }
      }
    }
    > * {
      transition: all ease-in-out 0.3s;
    }
    .search {
      .screen-xs-max({
        display: none;
      });
    }
  }
  > .search {
    display: block;
    grid-row-start: 2;
    padding: 9px 20px;
    color: #fff;
    background-color: #333;
    .screen-sm-min({
      display: none;
    });
    > form {
      input {
        color: #fff;
      }
    }
  }
  svg {
    transition: all ease-in-out 0.3s;
    &.fa-bars {
      font-size: 2em;
      font-size: 1.7em;
      line-height: 1.2;
      opacity: 1;
      justify-self: end;
      grid-column-start: 4;
      grid-row-start: 1;
    }
  }
  .menu {
    grid-row-start: 1;
    grid-column-start: 4;
    text-align: right;
    .screen-xs-max({
      grid-column-start: 2;
    });
    &.landing-panel {
      ul {
        left: 0;
        right: auto;
        > li {
          text-align: left;
          > a {
            color: initial;
            background-color: lighten(@brown, 45%);
            padding-left: 55px;
            &:hover {
              padding-left: 50px;
              padding-right: auto;
            }
          }
        }
      }
    }
    svg {
      font-size: 2em;
      transition: all ease-in-out 0.3s;
      &.fa-times {
        color: white;
        position: fixed;
        top: 20px;
        right: 20px;
      }
    }
    ul {
      position: absolute;
      top: 100px;
      right: 0;
      margin: 0;
      padding: 0;
      list-style: none;
      > li {
        text-align: right;
        font-size: 2em;
        &.active {
          > a {
            font-weight: 700;
          }
        }
        > a {
          font-weight: 200;
          color: white;
          padding: 8px 20px;
          line-height: 2.5;
          background-color: #ffffff40;
          transition: all ease-in-out 0.3s;
          &:hover {
            padding-right: 15px;
          }
        }
      }
    }
  }
  #menu-container {
    position: fixed;
    right: -100%;
    top: 0;
    margin: 0;
    bottom: 0;
    width: 100%;
    padding: 60px 20px 0 0;
    opacity: 0;
    z-index: 1;
  }
}

.content {
  grid-row-start: 2;
  grid-column-start: 1;
  grid-template-columns: 100%;
  .screen-xs-max({
    grid-row-start: 3;
  });
}

.nav-tabs {
  .nav-item {
    .nav-link {
      border-radius: 0;
      &.active {
        background: none;
      }
    }
  }
}

form {
  label {
    display: inline;
    width: 100%;
    font-weight: normal;
    text-transform: uppercase;
    font-size: 0.7em;
    margin-bottom: 2px;
  }
  input, textarea, select {
    display: block;
    width: 100%;
    padding: 3px 5px;
  }
  .form-field {
    position: relative;
    margin-bottom: 15px;
    .checkbox {
      font-size: 1.5em;
      margin: 5px 0 0 0;
    }
    .btn {
      &.btn-text {
        padding: 0;
        background: none;
        border: none;
      }
    }
  }
  .edit {
    background-color: #eee;
    padding: 15px;
    > div {
      &:nth-child(1){
        margin-bottom: 15px;
      }
    }
  }
}

@-webkit-keyframes rotation {
	from {
		-webkit-transform: rotate(0deg);
		transform: rotate(0deg);
	}
	to {
		-webkit-transform: rotate(359deg);
		transform: rotate(359deg);
	}
}
</style>
