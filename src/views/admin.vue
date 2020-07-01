<template>
  <div class="admin content">
    <recipe-test :data="savedRecipe" />
    <div class="manage">
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
                <th style="width: 80px;" class="text-right">
                  <router-link :to="{ name: 'admin', params: { recipe: 'add' }}">
                    <font-awesome-icon :icon="['fal', 'plus']" @click="addRecipe()" class="link" /> add
                  </router-link>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(recipe, id) in recipes" v-bind:key="id">
                <td>{{recipe.details.name}}</td>
                <td><span class="badge badge-pill badge-dark" v-for="(tag, index) in recipe.details.tags" v-bind:key="index">{{tag}}</span></td>
                <td>
                  <a v-bind:href="recipe.details.source.url" target="_blank" v-if="recipe.details.source.url">{{recipe.details.source.name}}</a>
                  <strong v-if="recipe.details.source.reference">{{recipe.details.source.reference}}</strong>
                </td>
                <td>{{recipe.details.enabled ? 'Yes' : 'No'}}</td>
                <td class="text-right">
                  <router-link :to="{ name: 'admin', params: { recipe: id }}">
                    <font-awesome-icon :icon="['fal', 'edit']" class="link" /> edit
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="savedRecipe">
          <form class="inner" name="recipeForm">
            <router-link :to="{ name: 'admin', params: {}}" class="float-right link">
              <font-awesome-icon :icon="['fal', 'times']" /> close
            </router-link>
            <h4>
              <span>{{{true: 'Edit', false: 'Add'}[recipe !== 'add']}} Recipe</span>
            </h4>
            <span style="margin-left: 20px;" class="link" v-if="recipe === 'add'" @click="saveRecipe()">
              <font-awesome-icon :icon="['fal', 'plus']" /> confirm
            </span>
            <span style="margin-left: 20px;" class="link text-danger" v-if="recipe !== 'add'" @click="deleteRecipe()">
              <font-awesome-icon :icon="['fal', 'trash']" /> delete
            </span>
            <section>
              <!--
              <pre>{{savedRecipe}}</pre>
            -->
            <div class="details" v-bind:class="{'edit': edit.details}">
              <h5>
                <span>Details</span>
                <span class="float-right link" v-if="recipe !== 'add'" @click="editComponent('details')">
                  <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.details]]" /> {{edit.details ? 'save' : 'edit'}}
                </span>
              </h5>
              <div class="form-field image">
                <div class="image recipe-image-edit" v-bind:style="savedRecipe.details.imageStyle"></div>
                <input v-if="edit.details && !imageUploading" style="width: auto; margin: 15px 0 0 -5px;" type="file" id="newImage" ref="newImage" name="image" @change="imageOnChange" />
                <span style="margin: 15px 0;" class="link" v-if="edit.details && imageFiles.length > 0 && !imageUploading" @click="saveImage()">
                  <font-awesome-icon :icon="['fal', 'check']" /> upload image
                </span>
              </div>
              <div class="form-field">
                <label>Name</label>
                <input v-if="edit.details" type="text" name="name" v-model="savedRecipe.details.name" />
                <div v-if="!edit.details">{{savedRecipe.details.name.length > 0 ? savedRecipe.details.name : 'none'}}</div>
              </div>
              <div class="form-field">
                <label>Description</label>
                <textarea v-if="edit.details" name="description" v-model="savedRecipe.details.description"></textarea>
                <div v-if="!edit.details">{{savedRecipe.details.description.length > 0 ? savedRecipe.details.description : 'none'}}</div>
              </div>
              <div class="columns">
                <div class="form-field">
                  <label>Serves</label>
                  <input v-if="edit.details" type="number" name="serves" v-model="savedRecipe.details.serves" min="1" />
                  <div v-if="!edit.details">{{savedRecipe.details.serves}}</div>
                </div>
                <div class="form-field">
                  <label>Tags</label>
                  <font-awesome-icon v-if="edit.details && newTag.length > 0" :icon="['fal', 'plus']" @click="addTag()" style="position: absolute; top: 32px; right: 10px;" class="float-right link" />
                    <input v-if="edit.details" type="text" name="newTag" v-model="newTag" />
                    <div v-bind:style="{'margin-top': (edit.details ? '10' : '0') + 'px'}">
                      <span v-if="savedRecipe.details.tags.length == 0 && !edit.details">none</span>
                      <span class="badge badge-dark badge-pill" v-for="(tag, index) in savedRecipe.details.tags" v-bind:key="index">
                        {{tag}}
                        <span class="link" v-if="edit.details" @click="removeTag(index)">
                          <font-awesome-icon :icon="['fal', 'trash']" />
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Enabled</label>
                    <font-awesome-icon v-if="edit.details" :icon="['fal', { true: 'toggle-on', false: 'toggle-off'}[savedRecipe.details.enabled]]" @click="savedRecipe.details.enabled = !savedRecipe.details.enabled" style="display: block;" class="link" />
                    <div v-if="!edit.details">{{savedRecipe.details.enabled ? 'Yes' : 'No'}}</div>
                  </div>
                </div>
                <div class="source">
                  <div class="form-field full-width" v-show="!edit.details">
                    <label>Source</label>
                    <div>
                      <a v-bind:href="savedRecipe.details.source.url" target="_blank" v-if="savedRecipe.details.source.url">{{savedRecipe.details.source.name}}</a>
                      <span v-if="!savedRecipe.details.source.url">none</span>
                    </div>
                  </div>
                  <div class="form-field">
                    <label v-if="edit.details">Source Name</label>
                    <input v-if="edit.details" type="text" name="name" v-model="savedRecipe.details.source.name" />
                  </div>
                  <div class="form-field" v-if="edit.details">
                    <label>Source URL</label>
                    <input type="text" name="source-url" v-model="savedRecipe.details.source.url" min="1" />
                  </div>
                </div>
              </div>
              <div class="ingredients-steps">
                <div class="ingredients" v-bind:class="{'edit': edit.ingredients}">
                  <h5>
                    <span>Ingredients</span>
                    <span class="float-right link" v-if="recipe !== 'add'" @click="editComponent('ingredients')">
                      <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.ingredients]]" /> {{edit.ingredients ? 'save' : 'edit'}}
                    </span>
                  </h5>
                  <div style="margin-bottom: 15px;" v-if="edit.ingredients">
                    <span @click="addIngredient()" class="link">
                      <font-awesome-icon :icon="['fal', 'plus']" /> add component
                    </span>
                  </div>
                  <div class="empty" v-if="savedRecipe.ingredients.length === 0">
                    no ingredients to show
                  </div>
                  <div v-if="edit.ingredients" style="width: 85px;" class="form-field prep-duration">
                    <label>Prep Duration</label>
                    <input type="number" name="prep-duration" min="0" v-model="savedRecipe.prepDuration" />
                  </div>
                  <div v-if="!edit.ingredients">
                    <span style="margin-right: 10px;" class="badge badge-light badge-pill">{{savedRecipe.prepDuration}} minutes</span>
                    <label>Prep Duration</label>
                  </div>
                  <hr />
                  <div v-for="(ingredients, component) in savedRecipe.ingredients" v-bind:key="component">
                    <div class="ingredient-component" v-if="edit.ingredients && savedRecipe.ingredients.length > 0">
                      <div v-if="edit.ingredients" class="form-field component-name">
                        <label>Component</label>
                        <input type="text" v-bind:name="'ingredient-component-' + component" v-bind:disabled="savedRecipe.ingredients.length === 1" v-model="ingredients.component" />
                      </div>
                      <div class="link" v-if="edit.ingredients" @click="removeIngredient(component)">
                        <font-awesome-icon :icon="['fal', 'trash']" /> delete
                      </div>
                    </div>
                    <div class="component" v-if="!edit.ingredients">
                      <h6 v-if="savedRecipe.ingredients.length > 1">{{ingredients.component}}</h6>
                      <div class="ingredient" v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                        <span class="badge badge-light badge-pill" v-if="ingredient.quantity || ingredient.unit">{{ingredient.quantity}} {{ingredient.unit}}</span>
                        <span>{{ingredient.description}}</span>
                        <span v-if="ingredient.preparation"> <strong class="float-right">{{ingredient.preparation}}</strong></span>
                      </div>
                    </div>
                    <div v-if="edit.ingredients" class="ingredient-list">
                      <div v-for="(ingredient, index) in ingredients.list" v-bind:key="index">
                        <div class="form-field quantity">
                          <label v-if="index === 0">Quantity</label>
                          <input type="number" v-bind:name="'ingredient-quantity-' + component + '-' + index" v-model="ingredient.quantity" min="0"  @change="ingredient.quantity == 0 ? removeIngredient(component, index) : null" />
                        </div>
                        <div class="form-field unit">
                          <label v-if="index === 0">Unit</label>
                          <input type="text" v-bind:name="'ingredient-unit-' + component + '-' + index" v-model="ingredient.unit" />
                        </div>
                        <div class="form-field description">
                          <label v-if="index === 0">Description</label>
                          <input type="text" v-bind:name="'ingredient-description-' + component + '-' + index" v-model="ingredient.description" />
                        </div>
                        <div class="form-field preparation">
                          <label v-if="index === 0">Prep</label>
                          <input type="text" v-bind:name="'ingredient-preparation-' + component + '-' + index" v-model="ingredient.preparation" />
                        </div>
                      </div>
                    </div>
                    <div style="margin: 15px 0;">
                      <span v-if="edit.ingredients" @click="addIngredient(ingredients.component)" class="link">
                        <font-awesome-icon :icon="['fal', 'plus']" /> add ingredient
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
                    <span class="float-right link" v-if="recipe !== 'add'" @click="editComponent('steps')">
                      <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.steps]]" /> {{edit.steps ? 'save' : 'edit'}}
                    </span>
                  </h5>
                  <div>
                    <span style="margin-right: 10px;" class="badge badge-light badge-pill">{{showHoursMinutes(servingTime)}}</span>
                    <label>Method Duration</label>
                  </div>
                  <hr />
                  <div style="margin-bottom: 15px;" v-if="edit.steps">
                    <span @click="addStep()" class="link">
                      <font-awesome-icon :icon="['fal', 'plus']" /> add step
                    </span>
                  </div>
                  <div class="empty" v-if="savedRecipe.steps.length === 0">
                    no steps to show
                  </div>
                  <div class="step" v-for="(step, index) in savedRecipe.steps" v-bind:key="index">
                    <div class="step-number">
                      <span class="badge badge-dark badge-pill">{{index + 1}}</span>
                    </div>
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
                    <span class="options float-right" v-if="edit.steps">
                      <span class="link" v-if="index > 0" @click="moveStep(index, -1)"><font-awesome-icon :icon="['fal', 'arrow-up']" /></span>
                      <span class="link" v-if="index < savedRecipe.steps.length-1" @click="moveStep(index, 1)"><font-awesome-icon :icon="['fal', 'arrow-down']" /></span> |
                      <span class="link" v-if="edit.steps" @click="removeStep(index)"><font-awesome-icon :icon="['fal', 'trash']" v-if="edit.steps" /> delete</span>
                    </span>
                    <div class="form-field description">
                      <label>Description</label>
                      <div v-if="!edit.steps">{{step.description}}</div>
                      <textarea v-if="edit.steps" v-bind:name="'step-description-' + index" v-model="step.description" rows="3"></textarea>
                    </div>
                    <div class="form-field ingredients-used" v-if="edit.steps">
                      <label>Ingredients Used</label>
                      <select name="assignIngredient" v-model="selectedIngredient" v-if="edit.steps && ingredientsForSteps.length > 0" @change="assignIngredient(index)">
                        <option value="">select an ingredient</option>
                        <option v-bind:value="ingredient" v-for="(ingredient, stepIngredient) in ingredientsForSteps" v-bind:key="stepIngredient">{{ingredient.componentName}} - {{ingredient.description}}</option>
                      </select>
                      <div v-if="edit.steps">
                        <div v-if="ingredientsForSteps.length == 0">All ingredients have been allocated.</div>
                        <span v-for="(ingredient, ingredientIndex) in step.ingredientsUsed" v-bind:key="ingredientIndex">
                          <span style="margin: 10px 10px 0 0;" class="badge badge-light badge-pill" v-if="findIngredient(ingredient, savedRecipe)">
                            <input v-if="ingredient.quantity" class="badge-input" type="number" min="0" :max="findIngredient(ingredient, savedRecipe).quantity" v-model="ingredient.quantity" @change="ingredient.quantity == 0 ? removeIngredientUsed(index, ingredientIndex) : null" />
                            {{findIngredient(ingredient, savedRecipe).unit}}, {{findIngredient(ingredient, savedRecipe).description}}
                            <span class="link" v-if="edit.steps" @click="removeIngredientUsed(index, ingredientIndex)">
                              <font-awesome-icon :icon="['fal', 'trash']" />
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                    <div class="form-field depends-on" v-if="index > 0">
                      <label v-if="step.dependsOn || edit.steps">Depends On</label>
                      <select name="addDependent" v-model="selectedDependency" v-if="edit.steps" @change="addDependency(index)">
                        <option value="">select a step</option>
                        <option v-bind:value="stepDependency" v-show="stepDependency < index" v-for="(dependency, stepDependency) in savedRecipe.steps" v-bind:key="stepDependency">{{stepDependency + 1}} - {{dependency.description}}</option>
                      </select>
                      <div v-if="step.dependsOn !== null">
                        <span style="margin: 10px 10px 0 0;" class="badge badge-light badge-pill">
                          step {{step.dependsOn + 1}}
                          <span class="link" v-if="edit.steps" @click="removeDependency(index)">
                            <font-awesome-icon :icon="['fal', 'trash']" />
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
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import loginForm from '@/components/login-form.vue';
import recipeTest from '@/components/recipe-test.vue';
const fb = require('../firebase.js');

export default {
  name: 'admin',
  mixins: [mixins],
  components: {
    loginForm,
    recipeTest
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
      imageUploading: false,
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
    ingredientsForSteps: function(){
      var that = this, ingredients = [], ingredientsForSteps = [];

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

      for(var k=0; k < ingredients.length; k++){
        var ingredientAdded = ingredients[k];
        ingredientAdded.quantity -= checkIfUsed(ingredientAdded).quantity;
        if(ingredientAdded.quantity > 0) ingredientsForSteps.push(ingredientAdded);
      }

      function checkIfUsed(ingredient){
        var ingredientUsed = {quantity: 0};
        for(var l=0; l < that.savedRecipe.steps.length;l++){
          var step = that.savedRecipe.steps[l];
          for(var m=0; m < step.ingredientsUsed.length; m++){
            var sameComponent = step.ingredientsUsed[m].component == ingredient.component;
            var sameIngredient = step.ingredientsUsed[m].ingredient == ingredient.ingredient;
            if(sameComponent && sameIngredient) ingredientUsed.quantity += parseInt(step.ingredientsUsed[m].quantity);
          }
        }
        return ingredientUsed;
      }

      return ingredientsForSteps;
    },
    testRecipe: function(){
      return this.savedRecipe ? this.savedRecipe : {};
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
    editRecipe: function(id){
      if(id && this.recipes){
        this.savedRecipe = this.clone(this.recipes[id]);
      }else{
        this.savedRecipe = null;
        this.edit = {
          details: false,
          ingredients: false,
          steps: false
        };
      }
    },
    addRecipe: function(){
      this.savedRecipe = this.template();
      this.edit = {
        details: true,
        ingredients: true,
        steps: true
      };
    },
    saveRecipe: function(){
      this.$store.dispatch('saveRecipe', this.savedRecipe);
    },
    deleteRecipe: function(){
      if(confirm('Are you sure you want to delete "' + this.savedRecipe.details.name + '"?')){
        this.$store.dispatch('deleteRecipe');
      }
    },
    editComponent: function(component, noToggle){
      if(!noToggle) this.edit[component] = !this.edit[component];

      if(!this.edit[component] || noToggle){
        var data = {};
        data[component] = this.savedRecipe[component];
        if(component == 'steps'){
          data.steps.forEach(function(step){
            if(step.duration !== null) step.duration = parseInt(step.duration);
            if(step.setupDuration !== null) step.setupDuration = parseInt(step.setupDuration);
          });
        }
        if(component == 'ingredients') data.prepDuration = this.savedRecipe.prepDuration;
        this.calcServingTime(this.savedRecipe);
        this.$store.dispatch('saveRecipe', data);
      }
    },
    addTag: function(){
      this.savedRecipe.details.tags.push(this.newTag);
      this.newTag = '';
    },
    removeTag: function(index){
      this.savedRecipe.details.tags.splice(index, 1);
    },
    imageOnChange: function(){
      this.imageFiles = this.$refs.newImage.files;
    },
    saveImage: function(){
      var reader = new FileReader();
      var url = 'recipe-photos/' + this.imageFiles[0].name;
      var ref = fb.storage.ref(url);
      var that = this;

      this.$store.commit('setUserMessage', { text: 'uploading image', type: 'text-info' });
      this.imageUploading = true;

      reader.readAsDataURL(this.imageFiles[0]);

      reader.onload = function () {
        ref.putString(reader.result, 'data_url').then(function() {
          that.imageUploading = false;
          that.imageFiles = [];
          that.savedRecipe.details.image = url;
          that.getImage(that.savedRecipe);
          that.editComponent('details', true)
          that.$store.commit('setUserMessage', { text: 'imaged successfully uploaded', type: 'text-success' });
        });
      };

      reader.onerror = function (error) {
        console.log('Error uploading image', error);
        that.$store.commit('setUserMessage', { text: 'issue uploading image', type: 'text-danger' });
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
    moveStep: function(index, offset){
      var newIndex = index + offset;
      this.savedRecipe.steps.splice(newIndex, 0, this.savedRecipe.steps.splice(index, 1)[0]);
		},
    removeStep: function(index){
      this.savedRecipe.steps.splice(index, 1);
    },
    assignIngredient: function(stepIndex){
      var ingredient = {
        component: this.selectedIngredient.component,
        ingredient: this.selectedIngredient.ingredient,
        quantity: this.selectedIngredient.quantity
      };
      this.savedRecipe.steps[stepIndex].ingredientsUsed.push(ingredient);
      this.selectedIngredient = '';
    },
    addDependency: function(stepIndex){
      this.savedRecipe.steps[stepIndex].dependsOn = this.selectedDependency;
      this.selectedDependency = '';
    },
    removeIngredientUsed: function(stepIndex, ingredientIndex){
      this.savedRecipe.steps[stepIndex].ingredientsUsed.splice(ingredientIndex, 1);
    },
    removeDependency: function(stepIndex){
      this.savedRecipe.steps[stepIndex].dependsOn = null
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
            quantity: 1,
            unit: ''
          };
          break;
        case 'step':
          template = {
            description: '',
            duration: 1,
            parallel: false,
            setupDuration: null,
            ingredientsUsed: [],
            dependsOn: null
          };
          break;
        default:
          template = {
            details: {
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
              enabled: true
            },
            prepDuration: 0,
            ingredients: [],
            steps: []
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
  },
  watch: {
    $route(to){
      if(to.params.recipe == 'add') this.addRecipe();
      else this.editRecipe(to.params.recipe);
    },
    savedRecipe: function(savedRecipe){
      if(savedRecipe) this.calcServingTime(savedRecipe);
    }
  }
}
</script>

<style scoped lang="less">
.admin {
  position: relative;
  h4 {
    display: inline-block;
  }
  > .manage {
    width: 100%;
    max-width: 900px;
    padding: 20px;
    margin: 5% auto 0;
  }
}

h3 {
  display: inline-block;
  padding-bottom: 5px;
  margin-bottom: 20px;
  border-bottom: 1px solid;
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
      height: 100%;
    }
  }
}

.ingredients-steps {
  &:not(.edit) {
    display: grid;
    grid-gap: 0 15px;
    grid-template-columns: 1fr 1fr;
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
    > .options {
      justify-self: end;
      grid-column: 4/6;
      grid-row-start: 1;
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
      .badge {
        font-weight: normal;
      }
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
    grid-template-columns: 60px 100px auto 80px;
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
    .preparation {
      grid-column-start: 4;
      grid-column-end: 5;
    }
  }
}

.ingredient-component {
  display: grid;
  grid-template-columns: auto;
  grid-auto-rows: minmax(10px, auto);
  margin-bottom: 20px;
  .form-field {
    &.component-name {
      grid-column-start: 1;
      grid-column-end: 2;
      margin-bottom: 5px;
    }
  }
}
</style>
