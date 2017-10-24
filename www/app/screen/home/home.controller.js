'use strict';

angular.module('recipeMerger')
	.controller('homeController', function($scope, $rootScope, $state, $timeout, recipes, findInArray) {
    $scope.ctrl = {
			recipes: [],
			method: [],
			scale: [],
			scaleIncrement: 5,
			minFinishTime: null,
			init: function(){
				this.setData();
				this.merge();
			},
			merge: function(){
				var ctrl = this, end = 0;

				var position = function(step, stepIndex, recipe){
					step = ctrl.stepPosition(step, stepIndex, recipe);
				};

				var stepEnd = function(step, stepIndex, recipe){
					if(recipe.end === undefined) recipe.end = 0;
					if(step.end > end) end = step.end;
					if(end > recipe.end) recipe.end = end;
				};

				var correctOffset = function(step, stepIndex, recipe){
					if(stepIndex === 0) recipe.offset = end - recipe.end;
					step.offset += recipe.offset;
					step.position.top = step.offset*4 + 'px';
				};

				var watchServingTimes = function(recipe, recipeIndex){
					$scope.$watch('ctrl.recipes[' + recipeIndex + '].servingTime', function(now, was){
						var offset = moment(now).diff(was, 'minute');
						if(offset) moveRecipe(recipeIndex, offset);
						ctrl.buildScale(true);
						ctrl.setupMethod();
					}, true);
				};

				function moveRecipe(recipeIndex, offset){
					ctrl.recipes[recipeIndex].offset += offset;

					angular.forEach(ctrl.recipes[recipeIndex].steps, function(step){
						step.offset += offset;
						step.position.top = step.offset*4 + 'px';
					});
				}

				ctrl.processRecipe(function(step, stepIndex, recipe, recipeIndex){
					step.index = stepIndex;
					step.recipe = recipeIndex;
				});

				ctrl.processRecipe(position);
				ctrl.processRecipe(stepEnd);
				ctrl.processRecipe(correctOffset);
				ctrl.processRecipe(null, watchServingTimes);

				ctrl.buildScale();
				ctrl.setupMethod();
			},
			setupMethod: function(){
				var ctrl = this;

				ctrl.method = [];

				var compileMethod = function(step, stepIndex, recipe, recipeIndex){
					var adjustedStep = angular.copy(step);
					adjustedStep.end += recipe.offset;
					ctrl.method.push(adjustedStep);
				};


				ctrl.processRecipe(compileMethod);

				ctrl.method.sort(function(a ,b){ return new Date(b.end) - new Date(a.end); });
			},
			fixOverlaps: function(){
				var ctrl = this;
				var overlapFound = null, overlaps = [];

				angular.forEach(ctrl.method, function(methodStep){
					angular.forEach(ctrl.recipes, function(recipe, recipeIndex){
						for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
							var step = recipe.steps[stepIndex];

							var ends = calculateEnds(step, methodStep, recipe);

							var recipeAdded = findInArray(overlaps, 'recipe', step.recipe) !== null;

							//var test = (recipeIndex+1) + '-' + (stepIndex+1) + ' ~ ' + (methodStep.recipe+1) + '-' + (methodStep.index+1) + ' | ' + ends.step.start + '-' + ends.step.finish + ' ~ ' + ends.methodStep.start + '-' + ends.methodStep.finish;
							//console.log(test);

							if(recipeIndex !== methodStep.recipe){
								if(overlapFound === null || (overlapFound.index === methodStep.index && overlapFound.recipe === methodStep.recipe)){
									checkStart();
									checkEnd();
								}
							}

							function checkStart(){
								if(ends.step.start >= ends.methodStep.start && ends.step.start < ends.methodStep.finish){
									//var startOverlap = (recipeIndex+1) + '-' + (stepIndex+1) + ' ~start overlap~ ' + (methodStep.recipe+1) + '-' + (methodStep.index+1);
									//console.log(startOverlap);
									overlapFound = methodStep;
									if(overlaps.indexOf(step) < 0 && !recipeAdded) overlaps.push(step);
								}
							}

							function checkEnd(){
								if(ends.step.finish <= ends.methodStep.finish && ends.step.finish > ends.methodStep.start){
									//var endOverlap = (recipeIndex+1) + '-' + (stepIndex+1) + ' ~end overlap~ ' + (methodStep.recipe+1) + '-' + (methodStep.index+1);
									//console.log(endOverlap);
									overlapFound = methodStep;
									if(overlaps.indexOf(step) < 0 && !recipeAdded) overlaps.push(step);
								}
							}
						}
					});
				});

				function calculateEnds(step, methodStep, recipe){
					var ends = {
						step: {
							duration: step.duration,
							start: 0,
							finish: step.end + recipe.offset
						},
						methodStep: {
							duration: methodStep.duration,
							start: 0,
							finish: methodStep.end
						}
					};

					if(step.parallel) ends.step.duration += step.setupDuration;
					ends.step.start = step.end - ends.step.duration + recipe.offset;

					if(methodStep.parallel) ends.methodStep.duration += methodStep.setupDuration;
					ends.methodStep.start = methodStep.end - ends.methodStep.duration;

					return ends;
				}

				angular.forEach(overlaps, function(step){
					var recipe = ctrl.recipes[step.recipe];
					var ends = calculateEnds(step, overlapFound, recipe);
					var offset = -ends.methodStep.duration;

					offset += ends.methodStep.finish - ends.step.finish;

					recipe.offset += offset;

					for(var stepIndex = step.index; stepIndex >= 0; stepIndex--){
						console.log('recipe:' + (step.recipe+1), 'step:' + (recipe.steps[stepIndex].index+1));

						recipe.steps[stepIndex].offset += offset;
						recipe.steps[stepIndex].position.top = recipe.steps[stepIndex].offset*4 + 'px';
					}
				});

				ctrl.buildScale(true);
				ctrl.setupMethod();
			},
			processRecipe: function(stepAction, recipeAction){
				var ctrl = this;
				angular.forEach(ctrl.recipes, function(recipe, recipeIndex){
					if(recipeAction) recipeAction(recipe, recipeIndex);
					angular.forEach(recipe.steps, function(step, stepIndex){
						if(stepAction) stepAction(step, stepIndex, recipe, recipeIndex);
					});
				});
			},
			stepPosition: function(step, index, recipe){
				var position = {height: 0, top: 0};

				var previousStep = index > 0 ? recipe.steps[index-1] : null;

				if(step.offset === undefined) step.offset = 0;

				if(!step.parallel) position.height = step.duration*4 + 'px';
				else position.height = (step.duration + step.setupDuration)*4 + 'px';

				if(previousStep){
					step.offset += previousStep.offset;

					if(previousStep.parallel){
						step.offset += previousStep.setupDuration;
						if(step.dependsOn) step.offset += previousStep.duration;
						position.top = step.offset*4 + 'px';
					}else{
						if(step.dependsOn){
							var finish = 0;

							angular.forEach(step.dependsOn, function(dependentStep){
								var dependent = recipe.steps[dependentStep];
								var stepFinish = dependent.offset + dependent.duration;
								if(dependent.parallel) stepFinish += dependent.setupDuration;
								if(stepFinish > finish) finish = stepFinish;
							});

							step.offset = finish;
						}else{
							step.offset += previousStep.duration;
						}
						position.top = step.offset*4 + 'px';
					}
				}

				step.position = position;

				step.end = step.offset + step.duration + step.setupDuration;
			},
			stepComponent: function(step, setupComponent){
				var styles = {height: 0, top: 0};

				if(setupComponent){
					styles.height = step.setupDuration*4 + 'px';
				}else{
					styles.height = step.duration*4 + 'px';
					styles.top = step.setupDuration*4 + 'px';
				}

				return styles;
			},
			buildScale: function(update){
				var ctrl = this, start = 0, finish = 0;

				var findFinish = function(step, stepIndex, recipe){
					var stepFinish = step.end + recipe.offset;
					if(stepFinish > finish) finish = stepFinish;
				};

				ctrl.processRecipe(findFinish);

				var finishTime = moment().add(finish, 'minutes');
				var minute = Math.ceil(finishTime.minute()/5)*5;
				if(minute == 60) minute = 0;
				finishTime = finishTime.set('minute', minute);

				angular.forEach(ctrl.recipes, function(recipe){
					if(!update){
						recipe.servingTime = finishTime;
						ctrl.minFinishTime = finishTime;
					}
				});

				ctrl.scale = [];
				for(var i = 0; i*ctrl.scaleIncrement <= finish; i++){
					ctrl.scale.push(i*ctrl.scaleIncrement);
				}
			},
			scaleLabel: function(increment){
				var minute = Math.ceil(moment().minute()/5)*5;
				if(minute == 60) minute = 0;
				var time = moment().set('minute', minute);
				return time.add(increment, 'minutes').format('hh:mm');
			},
			moveTimeMarker: function(){
				console.log('elapsedTime', this.elapsedTime);
			},
			setData: function(){
				this.recipes = [
					{
						"name": "Recipe 1",
						"steps": [
							{ "description": "Step 1", "duration": 15, "parallel": false, "setupDuration": null, "dependsOn": null },
							{ "description": "Step 2", "duration": 25, "parallel": true, "setupDuration": 5, "dependsOn": null },
							{ "description": "Step 3", "duration": 10, "parallel": false, "setupDuration": null, "dependsOn": [1] }
						]
					},
					{
						"name": "Recipe 2",
						"steps": [
							{ "description": "Step 1", "duration": 25, "parallel": false, "setupDuration": null, "dependsOn": null },
							{ "description": "Step 2", "duration": 30, "parallel": true, "setupDuration": 5, "dependsOn": null },
							{ "description": "Step 3", "duration": 15, "parallel": false, "setupDuration": null, "dependsOn": null },
							{ "description": "Step 4", "duration": 20, "parallel": false, "setupDuration": null, "dependsOn": [1, 2] }
						]
					},
					{
						"name": "Recipe 3",
						"steps": [
							{ "description": "Step 1", "duration": 5, "parallel": false, "setupDuration": null, "dependsOn": null },
							{ "description": "Step 2", "duration": 10, "parallel": true, "setupDuration": 5, "dependsOn": null },
							{ "description": "Step 3", "duration": 20, "parallel": false, "setupDuration": null, "dependsOn": [1] },
							{ "description": "Step 4", "duration": 30, "parallel": true, "setupDuration": 5, "dependsOn": null },
							{ "description": "Step 5", "duration": 20, "parallel": false, "setupDuration": null, "dependsOn": [3] }
						]
					}
				];
			}
		};
	});
