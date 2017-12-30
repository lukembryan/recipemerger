'use strict';

angular.module('sous')
	.controller('adminController', function($scope, $rootScope, $state, $timeout, recipes, findInArray) {
    $scope.ctrl = {
			recipe: null,
			edit: {
				recipe: null,
				details: false,
				ingredient: null,
				ingredientGroup: null,
				step: null
			},
			selectedDependency: '',
			newTag: '',
			newImage: null,
			init: function(){
				recipes.load(true);
			},
			save: function(){
				var ctrl = this;
				if(ctrl.edit.recipe) ctrl.updateRecipe();
				else ctrl.saveNewRecipe();
			},
			updateRecipe: function(){
				var ctrl = this, recipes = $rootScope.db.collection('recipes');

				$rootScope.loading = { show: true, label: 'updating recipe' };

				recipes.doc(ctrl.edit.recipe).set(ctrl.recipe).then(function(){
			    ctrl.closePanel();
					$rootScope.loading = { show: false, label: '' };
				}).catch(function(error){
			    console.error('updateRecipe error', error);
				});
			},
			saveNewRecipe: function(){
				var ctrl = this, recipes = $rootScope.db.collection('recipes');

				$rootScope.loading = { show: true, label: 'adding recipe' };

				recipes.add(ctrl.recipe).then(function(docRef){
					ctrl.closePanel();
					$rootScope.loading = { show: false, label: '' };
				}).catch(function(error){
				    console.error('saveNewRecipe error', error);
				});
			},
			closePanel: function(){
				var ctrl = this;

				$timeout(function(){
					ctrl.recipe = null;
					ctrl.edit.recipe = null;
					ctrl.edit.details = false;
					ctrl.edit.ingredient = null;
					ctrl.edit.ingredientGroup = null;
					ctrl.edit.step = null;
				}, 0);
			},
			editRecipe: function(id){
				var ctrl = this;
				ctrl.recipe = $rootScope.adminRecipes[id];
				ctrl.edit.recipe = id;
			},
			addRecipe: function(){
				var ctrl = this;

				ctrl.recipe = recipes.template();
				ctrl.edit.details = true;
			},
			editDetails: function(){
				var ctrl = this;
				ctrl.edit.details = !ctrl.edit.details;

				if(ctrl.edit.details){
					$timeout(function(){
						document.getElementById('newImage').addEventListener('change', function(){
							ctrl.newImage = this.files[0];
						}, false);
					}, 2000);
				}
			},
			addTag: function(){
				var ctrl = this;
				if(ctrl.newTag.length > 0 && ctrl.recipe.tags.indexOf(ctrl.newTag) < 0) ctrl.recipe.tags.push(ctrl.newTag);
				ctrl.newTag = '';
			},
			addIngredient: function(component){
				var ctrl = this;

				var componentFound = findInArray(ctrl.recipe.ingredients, 'component', component);

				if(componentFound !== null){
					ctrl.edit.ingredient = ctrl.recipe.ingredients[componentFound].list.push(recipes.template('ingredient')) - 1;
				}else{
					var ingredientGroup = ctrl.recipe.ingredients.push(recipes.template('ingredientGroup')) - 1;
					ctrl.recipe.ingredients[ingredientGroup].component = ctrl.recipe.ingredients.length === 1 ? 'all' : 'new';
					ctrl.edit.ingredientGroup = ctrl.recipe.ingredients[ingredientGroup].component;
				}
			},
			removeIngredient: function(component, ingredient){
				var ctrl = this;
				var componentFound = findInArray(ctrl.recipe.ingredients, 'component', component);

				if(ingredient !== undefined) ctrl.recipe.ingredients[componentFound].list.splice(ingredient, 1);
				else ctrl.recipe.ingredients.splice(componentFound, 1);

				if(ctrl.recipe.ingredients.length === 1) ctrl.recipe.ingredients[0].component = 'all';
			},
			addStep: function(){
				var ctrl = this;
				ctrl.edit.step = ctrl.recipe.steps.push(recipes.template('step')) - 1;
			},
			removeStep: function(step){
				var ctrl = this;
 				ctrl.recipe.steps.splice(step, 1);
			},
			filterSteps: function(currentStep){
				return function(step, index) {
					var include = index < currentStep;
					return include;
				}
			},
			addDependency: function(step){
				var ctrl = this;
				if(step.dependsOn === null) step.dependsOn = [];
				if(step.dependsOn.indexOf(parseInt(ctrl.selectedDependency)) < 0) step.dependsOn.push(parseInt(ctrl.selectedDependency));
				step.dependsOn.sort();
				ctrl.selectedDependency = '';
			},
			removeDependency: function(step, index){
				var ctrl = this;
				step.dependsOn.splice(index, 1);
				if(step.dependsOn.length == 0) step.dependsOn = null;
			},
			saveImage: function(){
				var ctrl = this, reader = new FileReader();
				var url = 'recipe-photos/' + ctrl.newImage.name;
				var ref = $rootScope.storage.ref(url);

				reader.readAsDataURL(ctrl.newImage);

				reader.onload = function () {
					ref.putString(reader.result, 'data_url').then(function(snapshot) {
					  ctrl.recipe.image = url;
						ctrl.newImage = null;
					});
				};

				reader.onerror = function (error) {
					console.log('Error: ', error);
				};
			},
			toggleParallel: function(step){
				step.parallel = !step.parallel;
				if(!step.parallel) step.setupDuration = null;
			}
		};
	});
