<template>
  <div class="home content">
    <section>
      <h1>
        <img src="img/logo.png" />
        <span>sizzle</span>
      </h1>
      <div class="menu landing-panel">
        <ul>
          <li v-for="(option, index) in options" v-bind:key="index">
            <router-link :to="option.path">{{option.label}}</router-link>
          </li>
          <li v-if="isAdmin" v-bind:class="{'active': page == 'admin'}">
            <router-link to="/admin">admin</router-link>
          </li>
        </ul>
      </div>
    </section>
    <recipe-masonry />
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import recipeMasonry from '@/components/recipe-masonry.vue';

export default {
  name: 'home',
  mixins: [mixins],
  components: {
    recipeMasonry
  },
  data: function(){
    return {
      options: [
        {
          label: 'browse recipes',
          path: '/browse'
        },
        {
          label: 'cook',
          path: '/cook'
        },
        {
          label: 'how it works',
          path: '/how-it-works'
        }
      ]
    };
  },
  computed: {
    isAdmin: function(){
      return this.$store.state.user && !this.$store.state.user.isAnonymous;
    }
  }
}
</script>

<style lang="less">
@import '../assets/less/shared.less';

.home {
  display: grid;
  grid-template-rows: 100%;
  position: relative;
  > p {
    grid-row-start: 1;
    grow-row-end: 2;
    padding: 20px;
  }
  > .recipe-masonry {
    grid-row-start: 1;
    grid-row-end: 2;
    grid-column-start: 2;
    grid-column-end: 3;
    > .grid-layout {
      border-left: 5px solid #eee;
    }
  }
  grid-column-start: 1;
  > section {
    position: fixed;
    top: 40px;
    left: 0;
    height: 100%;
    width: 40%;
    padding: 0 50px 50px;
    > h1 {
      font-size: 4em;
      margin: 0 0 40px;
      width: 100%;
      line-height: 1;
      color: lighten(@brown, 20%);
      > img {
        height: 50px;
        margin-right: 20px;
      }
    }
    > ul {
      &.landing-panel {
        > li {
          text-align: left;
          > a {
            &:hover {
              padding-left: 5px;
            }
          }
        }
      }
    }
  }
}
</style>
