<template>
  <div class="recipe content" ref="recipe">
    <div v-if="currentRecipe">
      <div class="details">
        <router-link v-if="isAdmin" class="float-right" :to="{ name: 'admin', params: { recipe: recipe }}">
          <font-awesome-icon :icon="['fal', 'edit']" class="link" /> edit
        </router-link>
        <span class="link" @click="backToRecipes()">
          <font-awesome-icon :icon="['fal', 'chevron-left']" /> continue browsing
        </span>
        <h2>{{currentRecipe.details.name}}</h2>
        <h3>{{currentRecipe.details.description}}</h3>
        <p v-if="currentRecipe.details.source.name">
          Original
          <a v-bind:href="currentRecipe.details.source.url" target="_blank" v-if="currentRecipe.details.source.url">{{currentRecipe.details.source.name}}</a>
        </p>
        <p>Serves <strong>{{currentRecipe.details.serves}}</strong></p>
        <div>
          <span class="badge badge-dark badge-pill" v-for="(tag, index) in currentRecipe.details.tags" v-bind:key="index">
            {{tag}}
          </span>
        </div>
      </div>
      <div class="image" v-bind:style="currentRecipe.details.imageStyle">
        <div class="time">
          <font-awesome-icon :icon="['fal', 'stopwatch']" />
          <span>{{showHoursMinutes(servingTime)}}</span>
        </div>
        <button class="btn primary" @click="cookRecipe()">
          <font-awesome-icon :icon="['fal', 'hat-chef']" /> {{progress.id == recipe ? 'continue' : 'start'}}
        </button>
      </div>
      <hr />
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <h4 class="nav-link link" v-bind:class="{'active': activeDetail == 'ingredients'}" @click="activeDetail = 'ingredients'">Ingredients</h4>
        </li>
        <li class="nav-item">
          <h4 class="nav-link link" v-bind:class="{'active': activeDetail == 'steps'}" @click="activeDetail = 'steps'">Steps</h4>
        </li>
      </ul>
      <div class="ingredients" v-bind:class="{'shown': activeDetail == 'ingredients'}">
        <h4>Ingredients</h4>
        <div class="component" v-for="(ingredients, component) in currentRecipe.ingredients" v-bind:key="component">
          <table class="table table-sm">
            <tbody>
              <tr v-if="currentRecipe.ingredients.length > 1">
                <td colspan="2">
                  <h5>{{ingredients.component}}</h5>
                </td>
              </tr>
              <tr v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                <td class="quantity">{{ingredient.quantity}} {{ingredient.unit}}</td>
                <td>{{ingredient.description}} <strong v-if="ingredient.preparation">{{ingredient.preparation}}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="empty" v-if="ingredients.list.length === 0">
            no ingredients to show
          </div>
        </div>
        <div class="empty" v-if="currentRecipe.ingredients.length === 0">
          no ingredients to show
        </div>
      </div>
      <div class="steps" v-bind:class="{'shown': activeDetail == 'steps'}">
        <h4>Steps</h4>
        <table class="table table-sm" v-if="currentRecipe.steps.length > 0">
          <tbody>
            <tr v-for="(step, index) in currentRecipe.steps" v-bind:key="index">
              <td style="width: 40px;">
                <span class="badge badge-light badge-pill">{{index + 1}}</span>
              </td>
              <td>{{step.description}}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty" v-if="currentRecipe.steps.length === 0">
          no steps to show
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
  name: 'recipe',
  mixins: [mixins],
  data: function(){
    return {
      activeDetail: 'ingredients'
    }
  },
  computed: {
    currentRecipe: function(){
      return this.$store.state.currentRecipe;
    },
    isAdmin: function(){
      return this.$store.state.user && !this.$store.state.user.isAnonymous;
    }
  },
  methods: {
    cookRecipe: function(){
      var progress = localStorage.getItem('progress');
      if(progress) progress = JSON.parse(progress);

      if(!progress || progress.id != this.recipe){
        this.$store.commit('setSelectedRecipe', null);

        var ingredientPrep = {};
        for(var i=0; i < this.currentRecipe.ingredients.length; i++){
          var component = this.currentRecipe.ingredients[i];
          if(!ingredientPrep[component.component]) ingredientPrep[component.component] = [];
        }

        var newProgress = {
          id: this.recipe,
          currentStep: 0,
          stepHistory: {},
          timer: {
            step: null,
            duration: 0,
            started: null,
            timeAdded: 0,
            show: false
          },
          ingredientPrep: ingredientPrep
        };

        newProgress.stepHistory[0] = [];
        newProgress.stepHistory[0].push(moment());

        newProgress = JSON.stringify(newProgress);

        console.log('newProgress', newProgress);

        localStorage.setItem('progress', newProgress);
      }

      var that = this;
      var recipe = this.$refs['recipe'];
      Velocity(recipe, { opacity: 0 }, { delay: 0, easing: 'easeInQuad' }, 150);
      setTimeout(function(){
        that.$router.push({ name: 'cook', params: {}});
      }, 150);
    },
    backToRecipes: function(){
      var that = this;
      var recipe = this.$refs['recipe'];
      Velocity(recipe, { opacity: 0 }, { delay: 0, easing: 'easeInQuad' }, 150);
      setTimeout(function(){
        that.$router.push({ name: 'browse', params: {}});
      }, 150);
    }
  },
  watch: {
    currentRecipe: function(currentRecipe){
      if(currentRecipe) this.calcServingTime(currentRecipe);
    }
  },
  mounted: function(){
    var that = this;
    var checkForRecipe = setInterval(function(){
      var recipe = that.$refs['recipe'];
      if(recipe){
        Velocity(recipe, { opacity: 1 }, { delay: 0, easing: 'easeInQuad' }, 150);
        clearInterval(checkForRecipe);
      }
    }, 100);
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.recipe {
  padding: 30px;
  opacity: 0;
  .screen-xs-max({
    padding: 20px;
  });
  .screen-lg-min({
    width: 900px;
    margin: 0 auto;
  });
  > div {
    width: 100%;
    max-width: 900px;
    display: grid;
    grid-gap: 30px;
    margin: auto;
    .screen-xs-max({
      grid-template-columns: 100%;
      grid-gap: 20px;
    });
  }
}
.details {
  grid-column-start: 1;
  grid-column-end: 2;
  > a {

  }
  > h2 {
    margin: 20px 45px 20px 0;
    font-size: 2.5em;
    font-weight: 100;
    line-height: 1;
  }
  > h3 {
    font-weight: 100;
    margin: 0 0 20px;
  }
}
.image {
  border: 1px solid @red;
  grid-column-start: 2;
  grid-column-end: 3;
  max-width: 600px;
  .screen-xs-max({
    grid-column-start: 1;
    grid-column-end: 2;
  });
  > .time {
    display: inline-block;
    padding: 6px 8px;
    color: #fff;
    margin: 20px 0 0 20px;
    background-color: #00000070;
    text-transform: none;
    line-height: 1.2;
    > svg {
      margin: 0 5px 0 0;
    }
  }
  > .btn {
    position: absolute;
    right: 20px;
    bottom: 20px;
  }
}
hr {
  width: 100%;
  margin: 0;
  border-width: 1px;
  border-color: #ccc;
  grid-column-start: 1;
  grid-column-end: 3;
  .screen-xs-max({
    display: none;
  });
}
.ingredients {
  line-height: 1.2;
  grid-column-start: 1;
  grid-column-end: 2;
  .screen-xs-max({
    display: none;
  });
  &.shown {
    .screen-xs-max({
      display: block;
      > h4 {
        display: none;
      }
    });
  }
  > .component {
    &:nth-child(3){
      margin-top: 15px;
    }
    h5 {
      border-bottom: none;
      margin-bottom: 0;
      margin-top: 15px;
    }
    .quantity {
      width: 100px;
      font-weight: 700;
    }
  }
}
.steps {
  grid-column-start: 2;
  grid-column-end: 3;
  .screen-xs-max({
    display: none;
    grid-column-start: 1;
    grid-column-end: 2;
  });
  &.shown {
    .screen-xs-max({
      display: block;
      > h4 {
        display: none;
      }
    });
  }
}
.nav {
  .screen-sm-min({
    display: none;
  });
  h4 {
    margin-bottom: 0;
  }
}
</style>
