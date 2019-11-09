<template>
  <div class="admin content">
    <h3>Admin</h3>
    <login-form v-if="user" v-bind:is-admin="isAdmin" />
    <div v-if="isAdmin" class="table-responsive">
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
          <tr v-for="(recipe, id) in recipes">
            <td>{{recipe.name}}</td>
            <td><span class="badge badge-pill badge-dark" v-for="tag in recipe.tags">{{tag}}</span></td>
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
      <div v-if="savedRecipe">
        <form class="inner" name="recipeForm">
          <div class="top-buttons">
            <font-awesome-icon :icon="['fal', 'times']" @click="editRecipe()" class="float-right link" />
          </div>
          <h4>
            <span>{{{true: 'Edit: "' + savedRecipe.name + '"', false: 'Add'}[recipe !== 'add']}}</span>
          </h4>
          <section>
            <h5>
              <span>Details</span>
              <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.details]]" class="float-right link" @click="editComponent('details')" />
            </h5>
            <div v-if="!edit.details">
              <span>
                Enabled
                <font-awesome-icon :icon="['fal', { true: 'toggle-on', false: 'toggle-off'}[savedRecipe.enabled]]" @click="savedRecipe.enabled = !savedRecipe.enabled" class="link" />
              </span>
              <hr />
              <div ng-if="!savedRecipe.details">
                <div class="image recipe-image-edit" v-bind:style="savedRecipe.imageStyle"></div>
              </div>
              <div>{{savedRecipe.description}}</div>
              <div>
                <span>Serves:</span>
                <span class="badge badge-dark badge-pill">{{savedRecipe.serves}}</span>
              </div>
              <div>
                <span>Tags:</span>
                <span class="badge badge-dark badge-pill" v-for="tag in savedRecipe.tags">{{tag}}</span>
              </div>
            </div>
            <div class="edit" v-if="edit.details">
              <div class="row">
                <div class="col-sm-12 col-md-6 col-lg-6">
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <label>Image</label>
                    <input type="file" id="newImage" name="image" />
                    <div class="image recipe-image-edit" v-bind:style="savedRecipe.imageStyle"></div>
                    <font-awesome-icon :icon="['fal', 'check']" class="float-right link" @click="saveImage()" />
                  </div>
                </div>
                <div class="col-sm-12 col-md-6 col-lg-6">
                  <div class="form-field col-sm-12 col-md-8 col-lg-8">
                    <label>Name</label>
                    <input type="text" name="name" v-model="savedRecipe.name" />
                  </div>
                  <div class="form-field col-sm-12 col-md-4 col-lg-4">
                    <label>Serves</label>
                    <input type="number" name="serves" v-model="savedRecipe.serves" min="1" />
                  </div>
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <label>Description</label>
                    <input type="text" name="description" v-model="savedRecipe.description" />
                  </div>
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <label>Tags</label>
                    <i style="margin: 10px 10px -25px;" class="link fa fa-plus no-underline pull-right" @click="addTag()"></i>
                    <input type="text" name="newTag" v-model="newTag" />
                    <hr class="short spacer" />
                    <div>
                      <span class="badge" v-for="tag in savedRecipe.tags">
                        {{tag}}
                        <i class="link fa fa-close no-underline"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h5>
              <span>Source</span>
              <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.source]]" class="float-right link" @click="editComponent('source')" />
            </h5>
            <div v-if="!edit.source">
              <div>
                <a v-bind:href="savedRecipe.source.url" target="_blank" v-if="savedRecipe.source.url">{{savedRecipe.source.name}}</a>
                <strong v-if="savedRecipe.source.reference">{{savedRecipe.source.reference}}</strong>
              </div>
            </div>
            <div class="edit" v-if="edit.source">
              <div class="row">
                <div class="col-sm-12 col-md-6 col-lg-6">
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <h5>Source</h5>
                    <label>Name</label>
                    <input type="text" name="name" ng-model="savedRecipe.source.name" />
                  </div>
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <label>URL</label>
                    <input type="text" name="source-url" ng-model="savedRecipe.source.url" min="1" />
                  </div>
                  <div class="form-field col-sm-12 col-md-12 col-lg-12">
                    <label>Reference</label>
                    <input type="text" name="source-reference" ng-model="savedRecipe.source.reference" />
                  </div>
                </div>
              </div>
            </div>
            <h5>
              <span>Ingredients</span>
              <font-awesome-icon :icon="['fal', { true: 'check', false: 'edit'}[edit.ingredients]]" class="float-right link" @click="editComponent('ingredients')" />
            </h5>
            <div class="empty" v-if="savedRecipe.ingredients.length === 0">
              no ingredients to show
            </div>
            <div v-if="!edit.ingredients">
              <div v-for="ingredients in savedRecipe.ingredients">
                <div class="ingredient-list col-sm-12 col-md-12 col-lg-12">
                  <h5 v-if="edit.ingredientGroup != ingredients.component && savedRecipe.ingredients.length > 1">{{ingredients.component}}</h5>
                  <span class="link" @click="edit.ingredientGroup = ingredients.component" v-if="edit.ingredientGroup != ingredients.component">
                    edit
                  </span>
                  <div class="ingredient" v-for="ingredient in ingredients.list" v-if="edit.ingredientGroup != ingredients.component">
                    <span>{{ingredient.description}}</span>
                    <span class="badge pull-right" v-if="ingredient.quantity || ingredient.unit">{{ingredient.quantity}} {{ingredient.unit}}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="edit" v-if="edit.ingredients">
              <div class="row">
                <div v-for="ingredients in savedRecipe.ingredients">
                  <div class="ingredient-list col-sm-12 col-md-12 col-lg-12">
                    <strong>
                      <span style="margin-right: 10px;" class="link no-underline" @click="removeIngredient(ingredients.component)"><i class="fa fa-trash"></i></span>
                      <span>Edit '{{ingredients.component.length > 0 ? ingredients.component : 'new component'}}' ingredients</span>
                    </strong>
                    <div class="form-field col-sm-10 col-md-10 col-lg-10">
                      <label>Component</label>
                      <input type="text" name="ingredient-component" v-bind:disabled="savedRecipe.ingredients.length === 1" v-model="ingredients.component" />
                    </div>
                    <div class="form-field col-sm-2 col-md-2 col-lg-2">
                      <button class="btn btn-success" @click="edit.ingredientGroup = null" v-if="edit.ingredientGroup == ingredients.component">
                        <i class="fa fa-check"></i>
                      </button>
                    </div>
                    <div class="pull-right" ng-if="edit.ingredient === null">
                      <button class="btn btn-primary" @click="addIngredient(ingredients.component)">
                        <i class="fa fa-plus"></i>
                      </button>
                    </div>
                    <div class="empty" v-if="ingredients.list.length === 0">
                      no ingredients to show
                    </div>
                    <div v-for="(ingredient, index) in ingredients.list">
                      <div v-if="edit.ingredient != index">
                        <span style="margin-right: 15px;" class="link no-underline" @click="edit.ingredient = index"><i class="fa fa-edit"></i></span>
                        <span style="margin-right: 15px;" class="link no-underline" @click="removeIngredient(ingredients.component, index)"><i class="fa fa-trash"></i></span>
                        <span>{{ingredient.description}} <span v-if="ingredient.quantity || ingredient.unit">-</span> {{ingredient.quantity}} {{ingredient.unit}}</span>
                      </div>
                      <!--
                      <div class="row" ng-if="ctrl.edit.ingredient == $index">
                        <hr class="spacer short" />
                        <div class="form-field col-sm-12 col-md-6 col-lg-6">
                          <label>Description</label>
                          <input type="text" name="ingredient-description-{{$parent.$index}}-{{$index}}" ng-model="ingredient.description" />
                        </div>
                        <div class="form-field col-sm-4 col-md-2 col-lg-2">
                          <label>Quantity</label>
                          <input type="number" name="ingredient-quantity-{{$parent.$index}}-{{$index}}" ng-model="ingredient.quantity" min="0" />
                        </div>
                        <div class="form-field col-sm-4 col-md-2 col-lg-2">
                          <label>Unit</label>
                          <input type="text" name="ingredient-unit-{{component}}-{{$index}}" ng-model="ingredient.unit" />
                        </div>
                        <div class="form-field col-sm-4 col-md-2 col-lg-2">
                          <button class="btn btn-success" ng-click="ctrl.edit.ingredient = null" ng-if="ctrl.edit.ingredient == $index">
                            <i class="fa fa-check"></i>
                          </button>
                        </div>
                      </div>
                    -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
          <!--
          <h4>
            <span>Steps</span>
            <button class="btn btn-primary" ng-click="ctrl.addStep()"><i class="fa fa-plus"></i></button>
          </h4>
          <hr />
          <div class="empty" ng-if="ctrl.recipe.steps.length === 0">
            no steps to show
          </div>
          <div ng-repeat="step in ctrl.recipe.steps">
            <div class="row" ng-if="ctrl.edit.step !== $index">
              <div class="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                <span class="badge">{{$index + 1}}</span>
                <span>{{step.description}}</span>
              </div>
              <div class="col-xs-10 col-sm-10 col-md-4 col-lg-4">
                <div><i class="fa fa-clock-o"></i> {{step.duration}} min</div>
                <hr class="short spacer" />
                <div>Parallel? <strong>{{{true: 'Yes', false: 'No'}[step.parallel]}}</strong></div>
                <div ng-if="step.parallel">Setup <i class="fa fa-clock-o"></i> {{step.setupDuration}} min</div>
                <hr class="short spacer" />
                <div ng-if="step.dependsOn">
                  <div>Depends On:</div>
                  <div><span class="badge" ng-repeat="dependency in step.dependsOn">Step {{dependency + 1}}</span></div>
                </div>
              </div>
              <div class="col-xs-2 col-sm-2 col-md-2 col-lg-2">
                <button class="btn btn-primary pull-right" ng-click="ctrl.edit.step = $index">
                  <i class="fa fa-edit"></i>
                </button>
              </div>
            </div>
            <div class="edit" ng-show="ctrl.edit.step === $index">
              <h5>
                <span style="margin-right: 10px;" class="link no-underline" ng-click="ctrl.removeStep($index)"><i class="fa fa-trash"></i></span>
                <span>Edit Step {{$index + 1}}</span>
              </h5>
              <div class="row">
                <div class="form-field col-sm-12 col-md-10 col-lg-10">
                  <label>Description</label>
                  <textarea name="step-description-{{$index}}" ng-model="step.description"></textarea>
                </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                  <button class="btn btn-success pull-right" ng-click="ctrl.edit.step = null">
                    <i class="fa fa-check"></i>
                  </button>
                </div>
                <div class="form-field col-sm-12 col-md-4 col-lg-4">
                  <label>Duration</label>
                  <input type="number" name="step-duration-{{$index}}" ng-model="step.duration" min="1" />
                </div>
                <div class="form-field col-sm-6 col-md-4 col-lg-4">
                  <label>Parallel</label>
                  <div>
                    <i class="fa checkbox" ng-class="{'fa-check-square-o': step.parallel, 'fa-square-o': !step.parallel}" ng-click="ctrl.toggleParallel(step)"></i>
                  </div>
                </div>
                <div class="form-field col-sm-6 col-md-4 col-lg-4" ng-if="step.parallel">
                  <label>Setup Duration</label>
                  <input type="number" name="step-setupduration-{{$index}}" ng-model="step.setupDuration" min="1" />
                </div>
                <div class="form-field col-sm-12 col-md-12 col-lg-12" ng-if="$index > 0">
                  <label>Depends On</label>
                  <select name="addDependent" ng-model="ctrl.selectedDependency" ng-change="ctrl.addDependency(step)">
                    <option value="">select a step</option>
                    <option value="{{$index}}" ng-repeat="dependency in shownSteps = (ctrl.recipe.steps | filter: ctrl.filterSteps($parent.$index))">{{$index + 1}} - {{dependency.description | limitTo: 50}}...</option>
                  </select>
                  <hr class="short spacer" />
                  <div ng-repeat="dependency in step.dependsOn">
                    <span style="margin-right: 15px;" class="link no-underline" ng-click="ctrl.removeDependency(step, $index)"><i class="fa fa-trash"></i></span>
                    <span class="badge">Step {{dependency + 1}}</span>
                  </div>
                </div>
              </div>
            </div>
            <hr class="short dotted" />
          </div>
        -->
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
        ingredientGroup: null,
        ingredient: null,
        steps: false
      },
      newTag: ''
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

.top-buttons {
  font-size: 1.2em;
}

form {
  label {
    display: block;
    width: 100%;
    font-weight: normal;
    text-transform: uppercase;
    font-size: 0.8em;
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
    background-color: #ddd;
    padding: 15px;
    margin: 15px -15px;
  }
}

.image {
  background-size: cover;
  background-position: center center;
  &.recipe-image-edit {
    width: 100%;
    height: 200px;
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
</style>
