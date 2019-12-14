<template>
  <div class="recipe content">
    <div v-if="currentRecipe">
      <div class="details">
        <router-link :to="{ name: 'browse', params: {}}" class="link">
          <font-awesome-icon :icon="['fal', 'chevron-left']" /> continue browsing
        </router-link>
        <h2>{{currentRecipe.details.name}}</h2>
        <h3>{{currentRecipe.details.description}}</h3>
        <p v-if="currentRecipe.details.source.name">
          Original
          <a v-bind:href="currentRecipe.details.source.url" target="_blank" v-if="currentRecipe.details.source.url">{{currentRecipe.details.source.name}}</a>
        </p>
        <p>
          Serves <strong>{{currentRecipe.details.serves}}</strong>
        </p>
        <div>
          <span class="badge badge-dark badge-pill" v-for="(tag, index) in currentRecipe.details.tags" v-bind:key="index">
            {{tag}}
          </span>
        </div>
      </div>
      <div class="image" v-bind:style="currentRecipe.details.imageStyle">
        <button class="btn" @click="cookRecipe()">
          <font-awesome-icon :icon="['fal', 'hat-chef']" /> cook
        </button>
      </div>
      <hr />
      <div class="ingredients">
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
                <td>{{ingredient.description}}</td>
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
      <div class="steps">
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

export default {
  name: 'recipe',
  mixins: [mixins],
  computed: {
    currentRecipe: function(){
      return this.$store.state.currentRecipe;
    }
  },
  methods: {
    cookRecipe: function(){
      this.$store.commit('setSelectedRecipes', []);
      localStorage.setItem('selectedRecipes', JSON.stringify([this.recipe]));
      this.$router.push({ name: 'cook', params: {}});
    }
  }
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.recipe {
  padding: 30px;
  > div {
    display: grid;
    grid-gap: 30px;
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
  -webkit-box-shadow: inset 0 0 10px #ddd;
  box-shadow: inset 0 0 70px #eee;
  border: 1px solid #ddd;
  grid-column-start: 2;
  grid-column-end: 3;
  .screen-xs-max({
    grid-column-start: 1;
    grid-column-end: 2;
  });
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
}
.ingredients {
  line-height: 1.2;
  grid-column-start: 1;
  grid-column-end: 2;
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
    grid-column-start: 1;
    grid-column-end: 2;
  });
}
</style>
