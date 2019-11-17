<template>
  <div id="layout">
    <header v-bind:class="{'compact': scrolledDown}">
      <h1 v-if="page != 'home'">
        <img src="/img/logo.png" />
        <router-link to="/" @click="showMenu = false">sizzle</router-link>
      </h1>
      <search v-if="page != 'home'" />
      <div class="menu">
        <font-awesome-icon :icon="['fal', 'bars']" v-if="!showMenu && page != 'home'" @click="showMenu = true" class="link" />
        <div v-if="showMenu" id="menu-container">
          <font-awesome-icon :icon="['fal', 'times']" @click="showMenu = false" class="link" />
          <ul>
            <li v-for="link in menu" v-bind:class="{'active': link.path == '/' + page}" v-bind:key="link.path">
              <router-link :to="link.path">{{link.label}}</router-link>
            </li>
            <li v-if="isAdmin" v-bind:class="{'active': page == 'admin'}">
              <hr style="border-color: white;" />
              <router-link to="/admin">admin</router-link>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="showMenu" class="overlay" @click="showMenu = false"></div>
    </header>
    <router-view/>
  </div>
</template>

<script>
import search from '@/components/search.vue';

export default {
  name: 'layout',
  components: {
    search
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
    page: function(){
      return this.$store.state.page;
    },
    scrolledDown: function(){
      return this.$store.state.scrolledDown;
    },
    isAdmin: function(){
      return this.$store.state.user && !this.$store.state.user.isAnonymous;
    }
  },
  methods: {
    updateScroll: function(e){
      this.$store.dispatch('updateScroll', e);
    },
    loadRecipes: function(){
      this.$store.dispatch('loadRecipes');
    }
  },
  beforeMount () {
    window.addEventListener('scroll', this.updateScroll);
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.updateScroll);
  },
  watch: {
    $route(to, from){
      this.showMenu = false;
      this.$store.dispatch('recipeLoaded', to.params.recipe);
      this.$store.dispatch('routeChanged', to.name);
    }
  }
};
</script>

<style lang="less">
@import 'assets/less/shared.less';

body {
  color: @purple;
  font-size: 16px;
  font-family: 'Titillium Web', sans-serif;
}

a, .link {
  color: lighten(@brown, 10%);
  cursor: pointer;
  font-weight: 400;
  &:hover, &:focus {
    text-decoration: none;
    color: lighten(@brown, 20%);
  }
}

.badge {
  margin-right: 3px;
  font-size: 1em;
  &.badge-light {
    border: 1px solid;
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 0;
}

h1 {
  display: inline-block;
  grid-column: 1/2;
  margin: -5px 0 0;
  line-height: 0.7;
  font-size: 3em;
  font-family: 'Share', cursive;
  z-index: 0;
  > a {
    color: lighten(@brown, 20%);
  }
  > img {
    height: 100%;
    margin-right: 2%;
  }
}

h2 {
  font-size: 2em;
}

h3 {
  font-size: 1.6em;
}

h4 {
  padding-bottom: 15px;
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

.svg-inline--fa {
  margin: 0px 0 -1px 3px;
}

.bold {
  font-weight: bold !important;
}

.empty {
  text-decoration: center;
  padding: 15px;
}

#layout {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 70px auto;
  > header {
    position: fixed;
    display: grid;
    grid-row: 1/2;
    grid-template-columns: 2fr 6fr;
    grid-template-rows: 100%;
    background-color: transparent;
    padding: 20px;
    top: 0;
    width: 100%;
    height: 70px;
    transition: all ease-in-out 0.3s;
    z-index: 1;
    &.compact {
      padding: 10px 20px;
      height: 50px;
      background-color: white;
      h1 {
        font-size: 2.4em;
        line-height: 0.9;
      }
      .search {
        font-size: 0.8em;
      }
      .menu {
        font-size: 0.8em;
        line-height: 2.5;
        svg {
          &.fa-times {
            top: 10px;
          }
        }
      }
    }
    > * {
      transition: all ease-in-out 0.3s;
    }
    .search {
      .screen-sm-max({
        display: none;
      });
    }
  }
  .menu {
    grid-row-start: 1;
    grid-column-start: 3;
    &.landing-panel {
      ul {
        > li {
          > a {
            text-align: left;
            color: initial;
            &:hover {
              padding-left: 5px;
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
      &.fa-bars {
        font-size: 1.7em;
        line-height: 1.2;
      }
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      > li {
        line-height: 2;
        text-align: right;
        font-size: 2em;
        &.active {
          > a {
            font-weight: 700;
          }
        }
        > a {
          display: block;
          font-weight: 200;
          color: white;
          transition: all ease-in-out 0.3s;
          &:hover {
            padding-right: 5px;
          }
        }
      }
    }
  }
  #menu-container {
    position: fixed;
    right: 0;
    top: 0;
    margin: 0;
    padding: 80px 20px 0 0;
    z-index: 1;
  }
  .content {
    grid-row-start: 2;
    grid-column-start: 1;
    display: grid;
    grid-template-rows: 70px auto;
    grid-template-columns: 100%;
    &.home {
      grid-template-columns: 2fr 3fr;
      grid-row-start: 1;
    }
  }
}
</style>
