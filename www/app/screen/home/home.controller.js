'use strict';

angular.module('recipeMerger')
	.controller('homeController', function($scope, $rootScope, $state, $timeout, recipes, findInArray) {
    $scope.ctrl = {
			recipes: [],
			method: [],
			scale: [],
			scaleIncrement: 5,
			servingTimes: {},
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

				var setIndexes = function(step, stepIndex, recipe, recipeIndex){
					step.index = stepIndex;
					step.recipe = recipeIndex;
				};

				ctrl.processRecipe(setIndexes);
				ctrl.processRecipe(position);
				ctrl.processRecipe(stepEnd);
				ctrl.processRecipe(correctOffset);

				ctrl.skippedOverlaps = [];

				ctrl.buildScale();
				ctrl.setupMethod();
			},
			buildScale: function(update){
				var ctrl = this, start = 0, finish = 0, servingTimesAdjustment = 0;

				var findFinish = function(step, stepIndex, recipe){
					var stepFinish = step.end + recipe.steps[0].offset;
					if(stepFinish > finish) finish = stepFinish;
				};

				var setServingTimes = function(recipe, recipeIndex){
					recipe.servingTime = finishTime;
					ctrl.minFinishTime = finishTime;
					ctrl.servingTimes[recipeIndex] = recipe.servingTime;

					if(recipe.steps[0].offset < 0 && recipe.steps[0].offset < -servingTimesAdjustment) servingTimesAdjustment = -recipe.steps[0].offset;
				};

				var adjustServingTimes = function(recipe, recipeIndex){
					recipe.servingTime = finishTime.add(servingTimesAdjustment, 'minutes');
					ctrl.minFinishTime = recipe.servingTime;
				};

				ctrl.processRecipe(findFinish);

				var finishTime = moment().add(finish, 'minutes');
				var minute = Math.ceil(finishTime.minute()/5)*5;
				if(minute == 60) minute = 0;
				finishTime = finishTime.set('minute', minute);

				if(!update) ctrl.processRecipe(null, setServingTimes);
				ctrl.processRecipe(null, adjustServingTimes);

				ctrl.scale = [];
				for(var i = 0; i*ctrl.scaleIncrement <= finish; i++){
					ctrl.scale.push(i*ctrl.scaleIncrement);
				}
			},
			setupMethod: function(){
				var ctrl = this;

				ctrl.method = [];

				var compileMethod = function(step, stepIndex, recipe, recipeIndex){
					var adjustedStep = angular.copy(step);
					adjustedStep.end = adjustedStep.offset + adjustedStep.duration;
					if(adjustedStep.parallel) adjustedStep.end += adjustedStep.setupDuration;
					ctrl.method.push(adjustedStep);
				};

				ctrl.processRecipe(compileMethod);

				ctrl.method.sort(function(a ,b){ return new Date(b.end) - new Date(a.end); });
			},
			fixOverlaps: function(){
				var ctrl = this;
				var stepToHold = null, holdCandidates = [], holdEnd = null, overlaps = [], ends;

				compareMethodToRecipes();

				var comparison = {
					shortest: null,
					latestStep: null
				};

				angular.forEach(holdCandidates, function(step, stepIndex){
					if(comparison.shortest === null || (step.duration + step.setupDuration) < comparison.shortest) comparison.shortest = step.duration + step.setupDuration;
					if(comparison.latestStep === null || step.index > comparison.latestStep) comparison.latestStep = step.index;
				});

				var stepRanking = {
					parallel: [],
					shortest: [],
					latestStep: []
				};

				angular.forEach(holdCandidates, function(step, stepIndex){
					if(step.parallel) stepRanking.parallel.push(stepIndex);
					if((step.duration + step.setupDuration) == comparison.shortest) stepRanking.shortest.push(stepIndex);
					if(step.index == comparison.latestStep) stepRanking.latestStep.push(stepIndex);
				});

				//console.log('comparison', comparison, stepRanking);


				console.log('holdCandidates', angular.copy(holdCandidates));

				if(stepRanking.parallel.length == 1){
					selectCandidate(stepRanking.parallel[0]);
				}else{
					if(stepRanking.shortest.length == 1){
						selectCandidate(stepRanking.shortest[0]);
					}else{
						selectCandidate(stepRanking.latestStep[0]);
					}
				}
				console.log('stepRanking', stepRanking);

				function selectCandidate(index){
					stepToHold = holdCandidates[index];
					holdCandidates.splice(index, 1);
				}

				compareMethodToRecipes();

				angular.forEach(overlaps, function(step){
					console.log((step.recipe+1) + '-' + (step.index+1) + ' overlaps ' + (stepToHold.recipe+1) + '-' + (stepToHold.index+1));
					console.log(step.offset + ':' + (step.end + ctrl.recipes[step.recipe].steps[0].offset), stepToHold.offset + ':' + stepToHold.end);
				});

				function compareMethodToRecipes(){
					angular.forEach(ctrl.method, function(methodStep){
						angular.forEach(ctrl.recipes, function(recipe, recipeIndex){
							for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
								var step = recipe.steps[stepIndex];

								if(stepToHold) ends = calculateEnds(step, stepToHold, recipe);
								else ends = calculateEnds(step, methodStep, recipe);

								if(recipeIndex !== methodStep.recipe) check(methodStep, step);
							}
						});
					});
				}

				function check(methodStep, step){
					var recipeAdded = findInArray(overlaps, 'recipe', step.recipe) !== null;

					if(ends.methodStep.start < ends.step.finish && ends.step.finish <= ends.methodStep.finish){
						if(stepToHold){
							var ignoreRecipe = stepToHold.recipe == step.recipe;
							var sameAsHoldStep = stepToHold.recipe === step.recipe && stepToHold.index === step.index;

							if(!sameAsHoldStep && !recipeAdded && !ignoreRecipe){
								overlaps.push(step);
							}
						}else{
							if(holdEnd === null || (ends.methodStep.finish === holdEnd && holdCandidates.indexOf(methodStep) < 0)){
								//var ignoreStep = (methodStep.parallel && !ctrl.recipes[methodStep.recipe].steps[methodStep.index+1].merged) || methodStep.merged;
								var ignoreStep = methodStep.merged;
								if(!ignoreStep){
									holdCandidates.push(methodStep);
									holdEnd = ends.methodStep.finish;
								}
							}
						}
					}
				}

				function calculateEnds(step, methodStep, recipe){
					var ends = {
						step: {
							duration: step.duration,
							start: 0,
							finish: step.end + recipe.steps[0].offset
						},
						methodStep: {
							duration: methodStep.duration,
							start: 0,
							finish: methodStep.end
						}
					};

					if(step.parallel) ends.step.duration += step.setupDuration;
					ends.step.start += step.end - step.duration + recipe.steps[0].offset;

					if(methodStep.parallel) ends.methodStep.duration += methodStep.setupDuration;
					ends.methodStep.start += methodStep.end - ends.methodStep.duration;

					return ends;
				}

				var overlapDuration = 0;
				if(stepToHold) overlapDuration = angular.copy(stepToHold.duration);

				var sameRecipeOverlaps = [];
				angular.forEach(ctrl.recipes[stepToHold.recipe].steps, function(sameRecipeStep){
					ends = calculateEnds(sameRecipeStep, stepToHold, ctrl.recipes[stepToHold.recipe]);
					if(ends.methodStep.start < ends.step.finish && ends.step.finish <= ends.methodStep.finish){
						var sameAsHoldStep = stepToHold.recipe === sameRecipeStep.recipe && stepToHold.index === sameRecipeStep.index;
						if(!sameAsHoldStep) sameRecipeOverlaps.push(sameRecipeStep);
					}
				});

				console.log('sameRecipeOverlaps', sameRecipeOverlaps);

				angular.forEach(overlaps, function(step){
					//console.log((step.recipe+1) + ':' + (step.index+1), ', step:' + step.parallel, ', stepToHold:' + stepToHold.parallel);
					var recipe = ctrl.recipes[step.recipe];
					var ends = calculateEnds(step, stepToHold, recipe);

					//var followingStepMerged = true;
					//if(ctrl.recipes[step.recipe].steps[step.index+1]) followingStepMerged = ctrl.recipes[step.recipe].steps[step.index+1].merged;

					var offset = -ends.methodStep.duration;
					offset += ends.methodStep.finish - ends.step.finish;


					for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
						var stepToMove = recipe.steps[stepIndex];
						var allowOverlap = false;

						if(stepToHold.parallel && !stepToMove.parallel){
							holdCandidates.sort(function(a ,b){ return new Date(b.duration) - new Date(a.duration); });

							angular.forEach(holdCandidates, function(holdCandidate){
								if(holdCandidate.recipe == stepToMove.recipe && holdCandidate.index == stepToMove.index){
									if(holdCandidate.duration < overlapDuration){
										allowOverlap = true;
										overlapDuration -= holdCandidate.duration;
									}
								}
							});
						}

						if(allowOverlap){
							offset += stepToMove.duration;
							if(step.index == 0)  offset = 0;
							stepToMove.end -= offset;
							stepToMove.merged = true;
						}else{
							if(stepIndex <= step.index){
								stepToMove.offset += offset;
								stepToMove.position.top = stepToMove.offset*4 + 'px';
							}else{
								if(step.index == 0)  offset = 0;
								stepToMove.end -= offset;
							}
						}
					}
				});

				if(stepToHold) ctrl.recipes[stepToHold.recipe].steps[stepToHold.index].merged = true;

				function calculateAdjustment(){
					var adjust = 0;
					ctrl.processRecipe(function(step, stepIndex, recipe, recipeIndex){
						if(step.offset < 0 && step.offset < adjust) adjust = step.offset;
					});

					return -adjust;
				}

				var adjustRecipes = calculateAdjustment();

				ctrl.processRecipe(null, function(recipe, recipeIndex){
					ctrl.moveRecipe(recipeIndex, adjustRecipes);
					recipe.offset = recipe.steps[0].offset;
				});

				ctrl.buildScale(true);
				ctrl.setupMethod();
			},
			moveRecipe: function(recipeIndex, offset){
				var ctrl = this;

				ctrl.recipes[recipeIndex].offset += offset;

				angular.forEach(ctrl.recipes[recipeIndex].steps, function(step){
					step.offset += offset;
					step.position.top = step.offset*4 + 'px';
				});
			},
			servingTimeChange: function(recipeIndex){
				var ctrl = this;
				var recipe = ctrl.recipes[recipeIndex];

				var finish = 0;
				angular.forEach(recipe.steps, function(step){
					var stepFinish = step.end + recipe.steps[0].offset;
					if(stepFinish > finish) finish = stepFinish;
				});

				var finishTime = moment.utc().add(finish, 'minutes');
				var minute = Math.ceil(finishTime.minute()/5)*5;
				if(minute == 60) minute = 0;
				finishTime = finishTime.set('minute', minute);

				var offset = moment(recipe.servingTime).diff(ctrl.servingTimes[recipeIndex], 'minute');
				if(offset) ctrl.moveRecipe(recipeIndex, offset);
				ctrl.servingTimes[recipeIndex] = recipe.servingTime;

				ctrl.buildScale(true);
				ctrl.setupMethod();
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
			scaleLabel: function(increment){
				var minute = Math.ceil(moment().minute()/5)*5;
				if(minute == 60) minute = 0;
				var time = moment().set('minute', minute);
				return time.add(increment, 'minutes').format('hh:mm');
			},
			moveTimeMarker: function(){
				console.log('elapsedTime', this.elapsedTime);
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
