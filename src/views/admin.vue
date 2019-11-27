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
                <font-awesome-icon :icon="['fal', 'edit']" @click="editRecipe(id, true)" class="link" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="savedRecipe">
        <form class="inner" name="recipeForm">
          <span class="float-right link" @click="editRecipe(null, true)">
            close <font-awesome-icon :icon="['fal', 'times']" />
          </span>
          <h4>
            <span>{{{true: 'Edit', false: 'Add'}[recipe !== 'add']}} Recipe</span>
          </h4>
          <section>
            <!--
            -->
            <pre>{{savedRecipe.steps}}</pre>
            <div class="details" v-bind:class="{'edit': edit.details}">
              <h5>
                <span>Details</span>
                <span class="float-right link" @click="editComponent('details')">
                  {{edit.details ? 'save' : 'edit'}} <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.details]]" />
                </span>
              </h5>
              <div class="form-field image">
                <div class="image recipe-image-edit" v-bind:style="savedRecipe.imageStyle"></div>
                <span style="margin: 15px 0;" class="float-right link" v-if="edit.details">
                  upload image <font-awesome-icon :icon="['fal', 'check']" @click="saveImage()" />
                </span>
                <input v-if="edit.details" style="display: inline; width: auto; margin: 15px 0 0 -5px;" type="file" id="newImage" ref="newImage" name="image" @change="imageOnChange" />
              </div>
              <div class="form-field">
                <label>Name</label>
                <input v-if="edit.details" type="text" name="name" v-model="savedRecipe.name" />
                <div v-if="!edit.details">{{savedRecipe.name.length > 0 ? savedRecipe.name : 'none'}}</div>
              </div>
              <div class="form-field">
                <label>Description</label>
                <textarea v-if="edit.details" name="description" v-model="savedRecipe.description"></textarea>
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
                  <font-awesome-icon v-if="edit.details && newTag.length > 0" :icon="['fal', 'plus']" @click="addTag()" style="position: absolute; top: 32px; right: 10px;" class="float-right link" />
                  <input v-if="edit.details" type="text" name="newTag" v-model="newTag" />
                  <div v-bind:style="{'margin-top': (edit.details ? '10' : '0') + 'px'}">
                    <span v-if="savedRecipe.tags.length == 0 && !edit.details">none</span>
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
                    <span v-if="!savedRecipe.source.url">none</span>
                  </div>
                </div>
                <div class="form-field">
                  <label v-if="edit.details">Source Name</label>
                  <input v-if="edit.details" type="text" name="name" v-model="savedRecipe.source.name" />
                </div>
                <div class="form-field" v-if="edit.details">
                  <label>Source URL</label>
                  <input type="text" name="source-url" v-model="savedRecipe.source.url" min="1" />
                </div>
              </div>
            </div>
            <div class="ingredients-steps">
              <div class="ingredients" v-bind:class="{'edit': edit.ingredients}">
                <h5>
                  <span>Ingredients</span>
                  <span class="float-right link" @click="editComponent('ingredients')">
                    {{edit.ingredients ? 'save' : 'edit'}} <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.ingredients]]" />
                  </span>
                </h5>
                <div v-if="edit.ingredients">
                  <span @click="addIngredient()" class="link">
                    add component <font-awesome-icon :icon="['fal', 'plus']" />
                  </span>
                </div>
                <div class="empty" v-if="savedRecipe.ingredients.length === 0">
                  no ingredients to show
                </div>
                <div v-for="(ingredients, component) in savedRecipe.ingredients" v-bind:key="component">
                  <div class="ingredient-component" v-if="savedRecipe.ingredients.length > 0">
                    <div v-if="edit.ingredients" class="form-field component-name">
                      <label>Component</label>
                      <input type="text" v-bind:name="'ingredient-component-' + component" v-bind:disabled="savedRecipe.ingredients.length === 1" v-model="ingredients.component" />
                    </div>
                    <div class="form-field delete">
                      <div class="link" v-if="edit.ingredients" @click="removeIngredient(component)">
                        <font-awesome-icon :icon="['fal', 'trash']" />
                      </div>
                    </div>
                  </div>
                  <div class="component" v-if="!edit.ingredients">
                    <h6 v-if="savedRecipe.ingredients.length > 1">{{ingredients.component}}</h6>
                    <div class="ingredient" v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                      <span class="badge badge-light badge-pill" v-if="ingredient.quantity || ingredient.unit">{{ingredient.quantity}} {{ingredient.unit}}</span>
                      <span>{{ingredient.description}}</span>
                    </div>
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
                        <div class="link" v-if="edit.ingredients" @click="removeIngredient(component, index)">
                          <font-awesome-icon :icon="['fal', 'trash']" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span v-if="edit.ingredients" @click="addIngredient(ingredients.component)" class="link">
                      add ingredient <font-awesome-icon :icon="['fal', 'plus']" />
                    </span>
                  </div>
                  <div class="empty" v-if="ingredients.list.length === 0">
                    no ingredients to show
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
                <div v-if="edit.steps">
                  <span @click="addStep()" class="link">
                    add step <font-awesome-icon :icon="['fal', 'plus']" />
                  </span>
                </div>
                <div class="empty" v-if="savedRecipe.steps.length === 0">
                  no steps to show
                </div>
                <div class="step" v-for="(step, index) in savedRecipe.steps" v-bind:key="index">
                  <div class="step-number"><span class="badge badge-dark badge-pill">{{index + 1}}</span></div>
                  <div class="form-field">
                    <label>Duration</label>
                    <input type="number" name="'step-duration-' + index" v-if="edit.steps" v-model="step.duration" min="1" />
                    <div class="duration" v-if="!edit.steps"><font-awesome-icon :icon="['fal', 'clock']" /> {{step.duration}} min</div>
                  </div>
                  <div class="form-field">
                    <label>Parallel</label>
                    <font-awesome-icon v-if="edit.steps" :icon="['fal', { true: 'toggle-on', false: 'toggle-off'}[step.parallel]]" @click="step.parallel = !step.parallel" style="display: block;" class="link" />
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
                  <div class="form-field description">
                    <label>Description</label>
                    <div :contenteditable="edit.steps ? true : false">{{step.description}}</div>
                  </div>
                  <div class="form-field ingredients-used">
                    <label v-if="step.ingredientsUsed || edit.steps">Ingredients Used</label>
                    <select name="assignIngredient" v-model="selectedIngredient" v-if="edit.steps" @change="assignIngredient(index)">
                      <option value="">select an ingredient</option>
                      <option v-bind:value="ingredient" v-for="(ingredient, stepIngredient) in ingredientsForSteps" v-bind:key="stepIngredient">{{ingredient.componentName}} - {{ingredient.description}}</option>
                    </select>
                    <div v-if="edit.steps">
                      <span v-for="(ingredient, ingredientIndex) in step.ingredientsUsed" v-bind:key="ingredientIndex">
                        <span style="margin: 10px 10px 0 0;" class="badge badge-light badge-pill" v-if="findIngredient(ingredient)">
                          <input v-if="ingredient.quantity" class="badge-input" type="number" min="0" :max="findIngredient(ingredient).quantity" v-model="ingredient.quantity" />
                          {{findIngredient(ingredient).unit}}
                          {{findIngredient(ingredient).description}}
                          <span class="link" v-if="edit.steps" @click="removeIngredientUsed(index, ingredientIndex)">
                            <font-awesome-icon :icon="['fal', 'trash']" />
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="form-field depends-on" v-if="index > 0">
                    <label v-if="step.dependsOn || edit.steps">Depends On</label>
                    <div v-if="step.dependsOn && !edit.steps">
                      <span class="badge badge-light badge-pill" v-for="(dependency, dependencyIndex) in step.dependsOn" v-bind:key="dependencyIndex">step {{dependency + 1}}</span>
                    </div>
                    <select name="addDependent" v-model="selectedDependency" v-if="edit.steps" @change="addDependency(index)">
                      <option value="">select a step</option>
                      <option v-bind:value="stepDependency" v-show="stepDependency < index" v-for="(dependency, stepDependency) in savedRecipe.steps" v-bind:key="stepDependency">{{stepDependency + 1}} - {{dependency.description}}</option>
                    </select>
                    <div v-if="edit.steps">
                      <span v-for="(dependency, dependencyIndex) in step.dependsOn" v-bind:key="dependencyIndex">
                        <span style="margin: 10px 10px 0 0;" class="badge badge-light badge-pill">
                          step {{dependency + 1}}
                          <span class="link" v-if="edit.steps" @click="removeDependency(index, dependencyIndex)">
                            <font-awesome-icon :icon="['fal', 'trash']" />
                          </span>
                        </span>
                      </span>
                    </div>
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
import mixins from '@/mixins.js';
import loginForm from '@/components/login-form.vue';
const fb = require('../firebase.js');

export default {
  name: 'admin',
  mixins: [mixins],
  components: {
    loginForm
  },
  data: function(){
    return {
      savedRecipe: null,
      edit: {
        details: false,
        ingredients: false,
        steps: false
      },
      imageFiles: [],
      imageStyle: {},
      newTag: '',
      selectedIngredient: '',
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
    ingredientsForSteps: function(){
      var ingredients = [];
      for(var i=0; i < this.savedRecipe.ingredients.length; i++){
        var component = this.savedRecipe.ingredients[i];
        for(var j=0; j < component.list.length; j++){
          var ingredient = this.clone(component.list[j]);
          ingredient.component = i;
          ingredient.ingredient = j;
          ingredient.componentName = component.component;
          ingredients.push(ingredient);
        }
      }
      return ingredients;
    }
  },
  methods: {
    waitForRecipes: function(){
      var that = this;
      var recipesCheck = setInterval(function(){
        if(that.recipes){
          clearInterval(recipesCheck);
          that.editRecipe(that.recipe);
        }
      }, 100);
    },
    editRecipe: function(id, redirect){
      if(redirect) this.$router.push({ name: 'admin', params: { recipe: id }});

      if(id && this.recipes){
        this.savedRecipe = this.recipes[id];
      }else{
        this.savedRecipe = null;
      }
    },
    addRecipe: function(){
      this.$router.push({ name: 'admin', params: { recipe: 'add' }});
      this.savedRecipe = this.template();
      this.edit = {
        details: true,
        ingredients: true,
        steps: true
      };
    },
    editComponent: function(component){
      this.edit[component] = !this.edit[component];
      if(!this.edit[component]) console.log('save changes', component);
    },
    addTag: function(){
      this.savedRecipe.tags.push(this.newTag);
      this.newTag = '';
    },
    removeTag: function(index){
      this.savedRecipe.tags.splice(index, 1);
    },
    imageOnChange: function(){
      this.imageFiles = this.$refs.newImage.files;
    },
    saveImage: function(){
      var reader = new FileReader();
      var url = 'recipe-photos/' + this.imageFiles[0].name;
      var ref = fb.storage.ref(url);
      var component = this;

      reader.readAsDataURL(this.imageFiles[0]);

      reader.onload = function () {
        ref.putString(reader.result, 'data_url').then(function(snapshot) {
          console.log(snapshot);
          component.savedRecipe.image = url;
          component.imageFiles = [];
        });
      };

      reader.onerror = function (error) {
        console.log('Error uploading image', error);
      };
    },
    addIngredient: function(componentName){
      var ingredientsComponent = this.savedRecipe.ingredients.find(({component}) => component === componentName);

      if(ingredientsComponent){
        ingredientsComponent.list.push(this.template('ingredient')) - 1;
      }else{
        var ingredientGroup = this.savedRecipe.ingredients.push(this.template('ingredientGroup')) - 1;
        this.savedRecipe.ingredients[ingredientGroup].component = this.savedRecipe.ingredients.length === 1 ? 'all' : 'new';
      }
    },
    removeIngredient: function(component, ingredient){
      if(ingredient !== undefined) this.savedRecipe.ingredients[component].list.splice(ingredient, 1);
      else this.savedRecipe.ingredients.splice(component, 1);

      if(this.savedRecipe.ingredients.length === 1) this.savedRecipe.ingredients[0].component = 'all';
    },
    addStep: function(){
      this.savedRecipe.steps.push(this.template('step'));
    },
    removeStep: function(index){
      this.savedRecipe.steps.splice(index, 1);
    },
    assignIngredient: function(stepIndex){
      if(!this.savedRecipe.steps[stepIndex].ingredientsUsed) this.savedRecipe.steps[stepIndex].ingredientsUsed = [];
      var ingredient = {
        component: this.selectedIngredient.component,
        ingredient: this.selectedIngredient.ingredient,
        quantity: this.selectedIngredient.quantity
      };
      this.savedRecipe.steps[stepIndex].ingredientsUsed.push(ingredient);
      this.selectedIngredient = '';
    },
    findIngredient: function(ingredient){
      var foundIngredient = null;
      if(this.savedRecipe.ingredients[ingredient.component]){
        foundIngredient = this.savedRecipe.ingredients[ingredient.component].list[ingredient.ingredient];
      }
      return foundIngredient;
    },
    addDependency: function(stepIndex){
      if(!this.savedRecipe.steps[stepIndex].dependsOn) this.savedRecipe.steps[stepIndex].dependsOn = [];
      this.savedRecipe.steps[stepIndex].dependsOn.push(this.selectedDependency);
      this.selectedDependency = '';
    },
    removeIngredientUsed: function(stepIndex, ingredientIndex){
      this.savedRecipe.steps[stepIndex].ingredientsUsed.splice(ingredientIndex, 1);
      if(this.savedRecipe.steps[stepIndex].ingredientsUsed.length == 0) delete this.savedRecipe.steps[stepIndex].ingredientsUsed;
      console.log(this.savedRecipe.steps[stepIndex].ingredientsUsed, ingredientIndex);
    },
    removeDependency: function(stepIndex, dependencyIndex){
      this.savedRecipe.steps[stepIndex].dependsOn.splice(dependencyIndex, 1);
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
            imageStyle: this.imageStyle,
            tags: [],
            serves: 1,
            source: {
              name: '',
              url: ''
            },
            ingredients: [],
            steps: [],
            enabled: true
          };
          break;
      }

      return template;
    }
  },
  created(){
    var template = this.template();
    var that = this;

    this.getImage(template, function(style){
      that.imageStyle = style;
    });

    if(this.recipe){
      if(this.recipe == 'add') this.savedRecipe = template;
      else this.waitForRecipes();
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
    > div {
      border: 1px dotted #ccc;
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
    grid-template-columns: 40px 100px 60px 100px auto;
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
    .ingredients-used {
      grid-column-start: 1;
      grid-column-end: 6;
      grid-row-start: 3;
    }
    .depends-on {
      grid-column-start: 1;
      grid-column-end: 6;
      grid-row-start: 4;
    }
  }
  &.edit {
    .description {
      > div {
        padding: 5px 7px;
        background-color: #fff;
        border: 1px solid #aaa;
      }
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
    border: 1px solid #ccc;
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

.ingredient-component {
  display: grid;
  grid-template-columns: auto 20px;
  grid-auto-rows: minmax(10px, auto);
  .form-field {
    &.component-name {
      grid-column-start: 1;
      grid-column-end: 2;
    }
    &.delete {
      position: relative;
      grid-column-start: 2;
      grid-column-end: 3;
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
