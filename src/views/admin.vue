<template>
  <div class="admin content">
    <h3>Admin</h3>
    <login-form v-if="user" v-bind:is-admin="isAdmin" />
    <div v-if="isAdmin" >
      <div class="table-responsive">
        <table v-if="!recipe && recipes" class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tags</th>
              <th>Source</th>
              <th>Enabled</th>
              <th style="width: 30px;" class="text-right">
                <font-awesome-icon :icon="['fal', 'plus']" @click="addRecipe()" class="link" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(recipe, id) in recipes" v-bind:key="id">
              <td>{{recipe.name}}</td>
              <td><span class="badge badge-pill badge-dark" v-for="(tag, index) in recipe.tags" v-bind:key="index">{{tag}}</span></td>
              <td>
                <a v-bind:href="recipe.source.url" target="_blank" v-if="recipe.source.url">{{recipe.source.name}}</a>
                <strong v-if="recipe.source.reference">{{recipe.source.reference}}</strong>
              </td>
              <td>{{recipe.enabled ? 'Yes' : 'No'}}</td>
              <td class="text-right">
                <font-awesome-icon :icon="['fal', 'edit']" @click="editRecipe(id)" class="link" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="savedRecipe">
        <form class="inner" name="recipeForm">
          <span class="float-right link" @click="editRecipe()">
            close <font-awesome-icon :icon="['fal', 'times']" />
          </span>
          <h4>
            <span>{{{true: 'Edit', false: 'Add'}[recipe !== 'add']}} Recipe</span>
          </h4>
          <section>
            <div class="details" v-bind:class="{'edit': edit.details}">
              <h5>
                <span>Details</span>
                <span class="float-right link" @click="editComponent('details')">
                  {{edit.details ? 'save' : 'edit'}} <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.details]]" />
                </span>
              </h5>
              <div class="form-field image">
                <div class="image recipe-image-edit" v-bind:style="savedRecipe.imageStyle"></div>
                <font-awesome-icon v-if="edit.details" :icon="['fal', 'check']" style="margin: 15px 0;" class="float-right link" @click="saveImage()" />
                <input v-if="edit.details" style="display: inline; width: auto; margin: 15px 0 0 -5px;" type="file" id="newImage" name="image" />
              </div>
              <div class="form-field">
                <label>Name</label>
                <input v-if="edit.details" type="text" name="name" v-model="savedRecipe.name" />
                <div v-if="!edit.details">{{savedRecipe.name}}</div>
              </div>
              <div class="form-field">
                <label>Description</label>
                <textarea v-if="edit.details" name="description" v-model="savedRecipe.description" /></textarea>
                <div v-if="!edit.details">{{savedRecipe.description.length > 0 ? savedRecipe.description : 'none'}}</div>
              </div>
              <div class="columns">
                <div class="form-field">
                  <label>Serves</label>
                  <input v-if="edit.details" type="number" name="serves" v-model="savedRecipe.serves" min="1" />
                  <div v-if="!edit.details">{{savedRecipe.serves}}</div>
                </div>
                <div class="form-field">
                  <label>Tags</label>
                  <font-awesome-icon v-if="edit.details" :icon="['fal', 'plus']" @click="addTag()" style="position: absolute; top: 32px; right: 10px;" class="float-right link" />
                  <input v-if="edit.details" type="text" name="newTag" v-model="newTag" />
                  <div v-bind:style="{'margin-top': (edit.details ? '10' : '0') + 'px'}">
                    <span class="badge badge-dark badge-pill" v-for="(tag, index) in savedRecipe.tags" v-bind:key="index">
                      {{tag}}
                      <span class="link" v-if="edit.details" @click="removeTag(index)">
                        <font-awesome-icon :icon="['fal', 'trash']" />
                      </span>
                    </span>
                  </div>
                </div>
                <div class="form-field">
                  <label>Enabled</label>
                  <font-awesome-icon v-if="edit.details" :icon="['fal', { true: 'toggle-on', false: 'toggle-off'}[savedRecipe.enabled]]" @click="savedRecipe.enabled = !savedRecipe.enabled" style="display: block;" class="link" />
                  <div v-if="!edit.details">{{savedRecipe.enabled ? 'Yes' : 'No'}}</div>
                </div>
              </div>
              <div class="source">
                <div class="form-field full-width" v-show="!edit.details">
                  <label>Source</label>
                  <div>
                    <a v-bind:href="savedRecipe.source.url" target="_blank" v-if="savedRecipe.source.url">{{savedRecipe.source.name}}</a>
                    <strong v-if="savedRecipe.source.reference">{{savedRecipe.source.reference}}</strong>
                  </div>
                </div>
                <div class="form-field">
                  <label v-if="edit.details">Source Name</label>
                  <input v-if="edit.details" type="text" name="name" ng-model="savedRecipe.source.name" />
                </div>
                <div class="form-field" v-if="edit.details">
                  <label>Source URL</label>
                  <input type="text" name="source-url" ng-model="savedRecipe.source.url" min="1" />
                </div>
                <div class="form-field" v-if="edit.details">
                  <label>Source Reference</label>
                  <input type="text" name="source-reference" ng-model="savedRecipe.source.reference" />
                </div>
              </div>
            </div>
            <div class="ingredients-steps">
              <div v-if="savedRecipe.ingredients.length === 0">
                no ingredients to show
              </div>
              <div v-if="savedRecipe.steps.length === 0">
                no steps to show
              </div>
              <div class="ingredients" v-bind:class="{'edit': edit.ingredients}">
                <h5>
                  <span>Ingredients</span>
                  <span class="float-right link" @click="editComponent('ingredients')">
                    {{edit.ingredients ? 'save' : 'edit'}} <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.ingredients]]" />
                  </span>
                </h5>
                <div v-for="(ingredients, component) in savedRecipe.ingredients" v-bind:key="component">
                  <div v-if="ingredients.list.length === 0">
                    no ingredients to show
                  </div>
                  <div v-if="edit.ingredients" class="form-field">
                    <span @click="addComponent()" class="float-right link">
                      add <font-awesome-icon :icon="['fal', 'plus']" />
                    </span>
                    <label>Component</label>
                    <input type="text" v-bind:name="'ingredient-component-' + component" v-bind:disabled="savedRecipe.ingredients.length === 1" v-model="ingredients.component" />
                  </div>
                  <div class="component" v-if="!edit.ingredients">
                    <h6 v-if="savedRecipe.ingredients.length > 1">{{ingredients.component}}</h6>
                    <div class="ingredient" v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                      <span class="badge badge-light badge-pill" v-if="ingredient.quantity || ingredient.unit">{{ingredient.quantity}} {{ingredient.unit}}</span>
                      <span>{{ingredient.description}}</span>
                    </div>
                  </div>
                  <div style="text-align: right; margin-bottom: -25px;">
                    <span v-if="edit.ingredients" @click="addIngredient(ingredients.component)" class="link">
                      add <font-awesome-icon :icon="['fal', 'plus']" />
                    </span>
                  </div>
                  <div v-if="edit.ingredients" class="ingredient-list">
                    <div v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                      <div class="form-field quantity">
                        <label v-if="index === 0">Quantity</label>
                        <input type="number" v-bind:name="'ingredient-quantity-' + component + '-' + index" v-model="ingredient.quantity" min="0" />
                      </div>
                      <div class="form-field unit">
                        <label v-if="index === 0">Unit</label>
                        <input type="text" v-bind:name="'ingredient-unit-' + component + '-' + index" v-model="ingredient.unit" />
                      </div>
                      <div class="form-field description">
                        <label v-if="index === 0">Description</label>
                        <input type="text" v-bind:name="'ingredient-description-' + component + '-' + index" v-model="ingredient.description" />
                      </div>
                      <div class="form-field delete">
                        <div class="link" v-if="edit.ingredients" @click="removeIngredient(index)">
                          <font-awesome-icon :icon="['fal', 'trash']" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="steps" v-bind:class="{'edit': edit.steps}">
                <h5>
                  <span>Steps</span>
                  <span class="float-right link" @click="editComponent('steps')">
                    {{edit.steps ? 'save' : 'edit'}} <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.steps]]" />
                  </span>
                </h5>
                <div class="step" v-for="(step, index) in savedRecipe.steps" v-bind:key="index">
                  <div class="step-number"><span class="badge badge-dark badge-pill">{{index + 1}}</span></div>
                  <div class="form-field">
                    <label>Duration</label>
                    <input type="number" name="'step-duration-' + index" v-if="edit.steps" v-model="step.duration" min="1" />
                    <div class="duration" v-if="!edit.steps"><font-awesome-icon :icon="['fal', 'clock']" /> {{step.duration}} min</div>
                  </div>
                  <div class="form-field">
                    <label>Parallel</label>
                    <font-awesome-icon v-if="edit.steps" :icon="['fal', { true: 'toggle-on', false: 'toggle-off'}[step.parallel]]" @click="toggleParallel(step)" style="display: block;" class="link" />
                    <div v-if="!edit.steps">{{step.parallel ? 'Yes' : 'No'}}</div>
                  </div>
                  <div class="form-field">
                    <label v-if="step.parallel">Setup Duration</label>
                    <div v-if="!edit.steps && step.parallel"><font-awesome-icon :icon="['fal', 'clock']" /> {{step.setupDuration}} min</div>
                    <input type="number" v-bind:name="'step-setupduration-' + index" v-if="edit.steps && step.parallel" v-model="step.setupDuration" min="1" />
                  </div>
                  <span class="float-right link" v-if="edit.steps" @click="removeStep(index)">
                    delete <font-awesome-icon :icon="['fal', 'trash']" v-if="edit.steps" />
                  </span>
                  <div class="form-field depends-on" v-if="step.dependsOn && index > 0">
                    <label>Depends On</label>
                    <div v-if="!edit.steps">
                      <span class="badge badge-light badge-pill" v-if="!edit.steps" v-for="(dependency, dependencyIndex) in step.dependsOn" v-bind:key="dependencyIndex">{{dependency + 1}}</span>
                    </div>
                    <select name="addDependent" v-model="selectedDependency" v-if="edit.steps" @change="addDependency(step)">
                      <option value="">select a step</option>
                      <option v-bind:value="stepDependency" v-for="(dependency, stepDependency) in savedRecipe.steps">{{stepDependency + 1}} - {{dependency.description.substring(0,50)}}...</option>
                    </select>
                    <div v-if="edit.steps" v-for="(dependency, dependencyIndex) in step.dependsOn">
                      <span style="margin: 10px 10px 0 0;" class="badge badge-light badge-pill">Step {{dependencyIndex + 1}}</span>
                      <font-awesome-icon :icon="['fal', 'trash']" v-if="edit.steps" @click="removeDependency(step, dependencyIndex)" class="link" />
                    </div>
                  </div>
                  <div class="form-field description">
                    <label>Description</label>
                    <div v-if="!edit.steps">{{step.description}}</div>
                    <textarea v-if="edit.steps" v-bind:name="'step-description-' + index" v-model="step.description"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </form>
      </div>
      <div class="empty" v-if="!recipes && !recipe">
        no recipes to show
      </div>
    </div>
  </div>
</template>

<script>
import loginForm from '@/components/login-form.vue';

export default {
  name: 'admin',
  components: {
    loginForm
  },
  data: function(){
    return {
      edit: {
        details: false,
        source: false,
        ingredients: false,
        ingredient: null,
        steps: false
      },
      newTag: '',
      selectedDependency: ''
    };
  },
  computed: {
    user: function(){
      return this.$store.state.user;
    },
    isAdmin: function(){
      return this.user && !this.user.isAnonymous;
    },
    recipes: function(){
      return this.$store.state.recipes;
    },
    recipe: function(){
      return this.$store.state.recipe;
    },
    savedRecipe: function(){
      var savedRecipe = null;
      if(this.recipe && this.recipes){
        if(this.recipe === 'add'){
          savedRecipe = this.template();
          savedRecipe.details = true;
        }else{
          savedRecipe = this.recipes[this.recipe];
        }
      }
      return savedRecipe;
    }
  },
  methods: {
    editRecipe: function(id){
      this.$router.push({ name: 'admin', params: { recipe: id }})
    },
    addRecipe: function(){
      this.$router.push({ name: 'admin', params: { recipe: 'add' }})
    },
    editComponent: function(component){
      this.edit[component] = !this.edit[component];
    },
    addIngredient: function(){
      console.log('addIngredient');
    },
    template: function(component){
      var template;

      switch(component){
        case 'ingredientGroup':
          template = {
            component: '',
            list: []
          };
          break;
        case 'ingredient':
          template = {
            description: '',
            quantity: '',
            unit: ''
          };
          break;
        case 'step':
          template = {
            description: '',
            duration: 1,
            parallel: false,
            setupDuration: null,
            dependsOn: null
          };
          break;
        default:
          template = {
            name: '',
            description: '',
            image: '',
            tags: [],
            serves: 1,
            source: {
              name: '',
              url: '',
              reference: ''
            },
            ingredients: [],
            steps: [],
            enabled: true
          };
          break;
      }

      return template;
    }
  }
}
</script>

<style scoped lang="less">
.admin {
  position: relative;
  padding: 20px;
}

h5 {
  margin-top: 15px;
  .link {
    font-size: initial;
  }
}

.fa-toggle-on, .fa-toggle-off {
  font-size: 2em;
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
    &.half-width {
      width: 50%;
    }
    .checkbox {
      font-size: 1.5em;
      margin: 5px 0 0 0;
    }
    .btn {
      position: absolute;
      top: 15px;
      right: 15px;
    }
  }
  .half-width {
		.form-field {
			display: inline-block;
			box-sizing: border-box;
			width: 50%;
			margin: 0 -3px 15px 0;
      vertical-align: top;
			+ .form-field {
				margin: 0 0 15px -3px;
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

.details {
  display: grid;
  grid-gap: 0 15px;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(10px, auto);
  border: 1px solid #ccc;
  padding: 15px 15px 5px;
  margin-bottom: 15px;
  h5 {
    grid-column-start: 1;
    grid-column-end: 3;
    grid-row-start: 1;
    margin-top: 0;
  }
  .columns {
    display: grid;
    grid-column-gap: 15px;
    grid-template-columns: 100px auto 70px;
    grid-auto-rows: minmax(10px, auto);
    .form-field {
      &:nth-child(1){
        grid-column-start: 1;
        grid-column-end: 2;
      }
      &:nth-child(2){
        grid-column-start: 2;
        grid-column-end: 3;
      }
      &:nth-child(3){
        grid-column-start: 3;
        grid-column-end: 4;
      }
    }
  }
  &.edit {
    .source {
      display: grid;
      grid-gap: 0 15px;
      grid-template-columns: repeat(3, 1fr);
      grid-auto-columns: minmax(100px, auto);
      grid-auto-rows: minmax(10px, auto);
      .form-field {
        margin-bottom: 10px;
        &.full-width {
          grid-column-start: 1;
          grid-column-end: 4;
        }
        &:nth-child(2){
          grid-column-start: 1;
          grid-column-end: 2;
        }
        &:nth-child(3){
          grid-column-start: 2;
          grid-column-end: 3;
        }
        &:nth-child(4){
          grid-column-start: 3;
          grid-column-end: 4;
        }
      }
  }
  }
  .form-field {
    grid-column-start: 2;
    grid-column-end: 3;
    margin-bottom: 10px;
    &.image {
      grid-column-start: 1;
      grid-column-end: 2;
      grid-row-start: 2;
      grid-row-end: 6;
    }
  }
}

.ingredients-steps {
  &:not(.edit) {
    display: grid;
    grid-gap: 0 15px;
    grid-template-columns: 1fr 2fr;
    grid-auto-columns: minmax(100px, auto);
    grid-auto-rows: minmax(10px, auto);
    border: 1px dotted #ccc;
    > div {
      padding: 0 15px;
    }
  }
  .ingredient {
    margin-bottom: 10px;
    > span {
      &.badge {
        margin-right: 10px;
        font-size: 0.9em;
      }
    }
  }
}

.steps {
  .step {
    display: grid;
    grid-gap: 0 15px;
    grid-template-columns: 40px 100px 1fr 1fr 1fr;
    grid-auto-columns: minmax(100px, auto);
    grid-auto-rows: minmax(10px, auto);
    margin: 10px 0 20px;
    > .step-number {
      margin-top: 7px;
    }
    > .link {
      justify-self: end;
    }
    .form-field {
      margin-bottom: 10px;
    }
    .description {
      grid-column-start: 1;
      grid-column-end: 6;
      grid-row-start: 2;
    }
    .depends-on {
      grid-column-start: 1;
      grid-column-end: 6;
      grid-row-start: 3;
    }
  }
  &:not(.edit) {
    .step {
      .description {
        > div {
          padding: 10px;
          border: 1px solid #ccc;
          background-color: #f7f7f7;
        }
      }
    }
  }
}

.image {
  background-size: cover;
  background-position: center center;
  &.recipe-image-edit {
    width: 100%;
    height: 300px;
  }
  &.directory-image {
    position: relative;
    width: 100%;
    height: 200px;
    cursor: pointer;
    > .status {
      position: absolute;
      right: 0;
      bottom: 0;
      background: url('../assets/img/bg-black-50.png');
      padding: 8px 15px;
      color: white;
    }
    > button {
      position: absolute;
      bottom: 0;
      right: 0;
    }
  }
}

.table-responsive {
  margin: 0 -10px;
  width: initial;
}

.table {
  &.logic {
    > thead {
      > tr {
        > th {
          padding-bottom: 20px;
        }
      }
    }
    > tbody {
      > tr {
        > td {
          padding: 0;
        }
      }
    }
  }
}

.ingredient-list {
  .form-field {
    margin-bottom: 0;
  }
  > div {
    display: grid;
    grid-template-columns: 60px 100px auto 20px;
    grid-auto-rows: minmax(10px, auto);
    .quantity {
      grid-column-start: 1;
      grid-column-end: 2;
    }
    .unit {
      grid-column-start: 2;
      grid-column-end: 3;
    }
    .description {
      grid-column-start: 3;
      grid-column-end: 4;
    }
    .delete {
      position: relative;
      grid-column-start: 4;
      grid-column-end: 5;
      justify-self: end;
      align-self: end;
      > .link {
        position: absolute;
        bottom: 7px;
        right: 0px;
      }
    }
  }
}
</style>
