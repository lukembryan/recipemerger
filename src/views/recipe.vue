<template>
  <div class="recipe content">
    <div v-if="recipe">
      <router-link :to="{ name: 'browse', params: {}}" class="link">
        <font-awesome-icon :icon="['fal', 'times']" />
      </router-link>
      <div class="image" v-bind:style="recipe.details.imageStyle"></div>
      <div class="details">
        <h2>{{recipe.details.name}}</h2>
        <h3>{{recipe.details.description}}</h3>
        <p v-if="recipe.details.source.name">
          Original
          <a v-bind:href="recipe.details.source.url" target="_blank" v-if="recipe.details.source.url">{{recipe.details.source.name}}</a>
        </p>
        <p>
          Serves <strong>{{recipe.details.serves}}</strong>
        </p>
        <p>
          <span class="badge badge-dark badge-pill" v-for="(tag, index) in recipe.details.tags" v-bind:key="index">
            {{tag}}
          </span>
        </p>
      </div>
      <hr />
      <div class="ingredients">
        <h4>Ingredients</h4>
        <div class="component" v-for="(ingredients, component) in recipe.ingredients" v-bind:key="component">
          <table class="table table-sm">
            <tbody>
              <tr>
                <td colspan="2">
                  <h5 v-if="recipe.ingredients.length > 1">{{ingredients.component}}</h5>
                </td>
              </tr>
              <tr v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                <td style="width: 100px;">{{ingredient.quantity}} {{ingredient.unit}}</td>
                <td>{{ingredient.description}}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty" v-if="ingredients.list.length === 0">
            no ingredients to show
          </div>
        </div>
        <div class="empty" v-if="recipe.ingredients.length === 0">
          no ingredients to show
        </div>
      </div>
      <div class="steps">
        <h4>Steps</h4>
        <table class="table table-sm" v-if="recipe.steps.length > 0">
          <tbody>
            <tr v-for="(step, index) in recipe.steps" v-bind:key="index">
              <td style="width: 50px;">
                <span class="badge badge-light badge-pill">{{index + 1}}</span>
              </td>
              <td>{{step.description}}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty" v-if="recipe.steps.length === 0">
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
    recipe: function(){
      return this.$store.state.currentRecipe;
    }
  },
  methods: {}
}
</script>

<style scoped lang="less">
.recipe {
  padding: 30px;
  > div {
    display: grid;
    grid-template-columns: 2fr 3fr;
    grid-gap: 30px;
    > a {
      position: absolute;
      right: 30px;
      font-size: 2em;
      line-height: 1;
    }
  }
}
.image {
  -webkit-box-shadow: inset 0 0 10px #ddd;
  box-shadow: inset 0 0 10px #ddd;
  grid-column-start: 1;
  grid-column-end: 2;
}
.details {
  grid-column-start: 2;
  grid-column-end: 3;
  > h2 {
    margin: 0 45px 20px 0;
    font-size: 3em;
    font-weight: 100;
    line-height: 1;
  }
  > h3 {
    font-weight: 100;
    margin: 0 0 20px;
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
  }
}
.steps {
  grid-column-start: 2;
  grid-column-end: 3;
}
</style>
