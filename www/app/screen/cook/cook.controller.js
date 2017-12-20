'use strict';

angular.module('sous')
	.controller('cookController', function($scope, $rootScope, $state, $timeout, recipes, findInArray) {
    $scope.ctrl = {
			recipes: [],
			method: [],
			scale: [],
			scaleIncrement: 5,
			servingTimes: {},
			minFinishTime: null,
			holdCandidates: [],
			stepToHold: null,
			overlaps: [],
			sameRecipeOverlaps: [],
			init: function(){
				var ctrl = this;
				ctrl.recipes = [];
				angular.forEach($rootScope.recipes, function(recipe, id){
					recipe = angular.copy(recipe);
					recipe.id = id;
					ctrl.recipes.push(recipe);
				});
				//recipes.fromFile('f1d2e24a-d4d7-48e6-9211-2793aed6cb10');
				//recipes.fromFile('99eee451-7887-7a7a-424d-c0c5be756021');
				$timeout(function(){ctrl.buildRecipes();}, 1000);
			},
			buildRecipes: function(){
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
				//ctrl.processRecipe(correctOffset);

				ctrl.buildScale();
				ctrl.setupMethod();
			},
			merge: function(){
				this.scanForOverlaps(true);
			},
			buildScale: function(update){
				var ctrl = this, start = 0, finish = 0, servingTimesAdjustment = 0;

				var findFinish = function(step, stepIndex, recipe){
					var stepFinish = step.end + recipe.steps[0].offset;
					if(stepFinish > finish) finish = stepFinish;

					if(stepIndex == recipe.steps.length-1){
						var finishTime = moment().add(finish, 'minutes');
						var minute = Math.ceil(finishTime.minute()/5)*5;
						if(minute == 60) minute = 0;
						finishTime = finishTime.set('minute', minute);
						if(minute == 0) finishTime.add(1, 'hour');
						if(!update) recipe.servingTime = finishTime.format('Do MMMM, hh:mm a');
					}
				};

				ctrl.processRecipe(findFinish);

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
			stepThrough: function(){
				if(!this.stepToHold) this.scanForOverlaps();
				else this.fixOverlaps();
			},
			scanForOverlaps: function(loopThrough){
				var ctrl = this;
				var holdEnd = null, ends;

				compareMethodToRecipes();

				var comparison = {
					shortest: null,
					latestStep: null
				};

				angular.forEach(ctrl.holdCandidates, function(step, stepIndex){
					if(comparison.shortest === null || (step.duration + step.setupDuration) < comparison.shortest) comparison.shortest = step.duration + step.setupDuration;
					if(comparison.latestStep === null || step.index > comparison.latestStep) comparison.latestStep = step.index;
				});

				var stepRanking = {
					recipeEnd: [],
					parallel: [],
					shortest: [],
					latestStep: []
				};

				angular.forEach(ctrl.holdCandidates, function(step, stepIndex){
					if(step.index == ctrl.recipes[step.recipe].steps.length-1) stepRanking.recipeEnd.push(stepIndex);
					if(step.parallel) stepRanking.parallel.push(stepIndex);
					if((step.duration + step.setupDuration) == comparison.shortest) stepRanking.shortest.push(stepIndex);
					if(step.index == comparison.latestStep) stepRanking.latestStep.push(stepIndex);
				});

				if(stepRanking.recipeEnd.length == 1){
					selectCandidate(stepRanking.recipeEnd[0]);
				}else{
					if(stepRanking.parallel.length == 1){
						selectCandidate(stepRanking.parallel[0]);
					}else{
						if(stepRanking.shortest.length == 1){
							selectCandidate(stepRanking.shortest[0]);
						}else{
							selectCandidate(stepRanking.latestStep[0]);
						}
					}
				}

				function selectCandidate(index){
					ctrl.stepToHold = ctrl.holdCandidates[index];
					ctrl.holdCandidates.splice(index, 1);
				}

				compareMethodToRecipes();

				angular.forEach(ctrl.overlaps, function(step){
					//console.log((step.recipe+1) + '-' + (step.index+1) + ' overlaps ' + (ctrl.stepToHold.recipe+1) + '-' + (ctrl.stepToHold.index+1));
					//console.log(step.offset + ':' + (step.end + ctrl.recipes[step.recipe].steps[0].offset), ctrl.stepToHold.offset + ':' + ctrl.stepToHold.end);
				});

				function compareMethodToRecipes(){
					angular.forEach(ctrl.method, function(methodStep){
						angular.forEach(ctrl.recipes, function(recipe, recipeIndex){
							for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
								var step = recipe.steps[stepIndex];

								if(ctrl.stepToHold) ends = ctrl.calculateEnds(step, ctrl.stepToHold, recipe);
								else ends = ctrl.calculateEnds(step, methodStep, recipe);

								if(recipeIndex !== methodStep.recipe) check(methodStep, step);
							}
						});
					});
				}

				function check(methodStep, step){
					var recipeAdded = findInArray(ctrl.overlaps, 'recipe', step.recipe) !== null;
					var ignoreStep = false;

					if(ends.methodStep.start < ends.step.finish && ends.step.finish <= ends.methodStep.finish){
						if(ctrl.stepToHold){
							var ignoreRecipe = ctrl.stepToHold.recipe == step.recipe;
							var sameAsHoldStep = ctrl.stepToHold.recipe === step.recipe && ctrl.stepToHold.index === step.index;

							ignoreStep = step.merged;

							if(!sameAsHoldStep && !recipeAdded && !ignoreRecipe && !ignoreStep){
								ctrl.overlaps.push(step);
							}
						}else{
							if(holdEnd === null || (ends.methodStep.finish === holdEnd && ctrl.holdCandidates.indexOf(methodStep) < 0)){
								//var ignoreStep = (methodStep.parallel && !ctrl.recipes[methodStep.recipe].steps[methodStep.index+1].merged) || methodStep.merged;
								ignoreStep = methodStep.merged;
								if(!ignoreStep){
									ctrl.holdCandidates.push(methodStep);
									holdEnd = ends.methodStep.finish;
								}
							}
						}
					}
				}

				ctrl.sameRecipeOverlaps = [];

				if(ctrl.stepToHold){
					angular.forEach(ctrl.recipes[ctrl.stepToHold.recipe].steps, function(sameRecipeStep){
						ends = ctrl.calculateEnds(sameRecipeStep, ctrl.stepToHold, ctrl.recipes[ctrl.stepToHold.recipe]);
						if(ends.methodStep.start < ends.step.finish && ends.step.finish <= ends.methodStep.finish){
							var sameAsHoldStep = ctrl.stepToHold.recipe === sameRecipeStep.recipe && ctrl.stepToHold.index === sameRecipeStep.index;
							if(!sameAsHoldStep) ctrl.sameRecipeOverlaps.push(sameRecipeStep);
						}
					});

					if(loopThrough) ctrl.fixOverlaps(loopThrough);
				}
			},
			fixOverlaps: function(loopThrough){
				var ctrl = this, overlapDuration = 0;
				if(ctrl.stepToHold) overlapDuration = angular.copy(ctrl.stepToHold.duration);

				angular.forEach(ctrl.sameRecipeOverlaps, function(step){
					overlapDuration -= step.duration;
				});

				ctrl.holdCandidates.sort(function(a, b){ return new Date(b.duration) - new Date(a.duration); });

				angular.forEach(ctrl.holdCandidates, function(holdCandidate, index){
					if(ctrl.stepToHold.parallel && !holdCandidate.parallel && holdCandidate.duration <= overlapDuration){
						holdCandidate.allowOverlap = true;
						holdCandidate.overlapOffset = 0;
						var previous = ctrl.holdCandidates[index-1];
						if(index > 0 && previous.allowOverlap) holdCandidate.overlapOffset = previous.duration;
						overlapDuration -= holdCandidate.duration;
					}

					if(!ctrl.stepToHold.parallel && holdCandidate.parallel){
						var endOffset =  holdCandidate.end - ctrl.stepToHold.end;
						holdCandidate.allowParallelOverlap = holdCandidate.duration > (ctrl.stepToHold.duration + endOffset);
					}
				});

				angular.forEach(ctrl.overlaps, function(step){
					var recipe = ctrl.recipes[step.recipe];
					var ends = ctrl.calculateEnds(step, ctrl.stepToHold, recipe);
					var offset = -ends.methodStep.duration + (ends.methodStep.finish - ends.step.finish);
					var allowOverlap = false;
					var allowParallelOverlap = false;
					var overlapOffset = 0;

					angular.forEach(ctrl.holdCandidates, function(holdCandidate){
						if(holdCandidate.recipe == step.recipe && holdCandidate.index == step.index){
							if(holdCandidate.allowOverlap) allowOverlap = true;
							if(holdCandidate.allowParallelOverlap) allowParallelOverlap = true;
							overlapOffset = holdCandidate.overlapOffset;
						}
					});

					for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
						var stepToMove = recipe.steps[stepIndex];

						if(allowOverlap){
							if(stepIndex == step.index){
								offset += stepToMove.duration;
								stepToMove.offset -= overlapOffset;
								stepToMove.end -= (step.index == 0 ? 0 : offset);
								stepToMove.merged = true;
							}else{
								if(stepIndex <= step.index){
									if(offset == 0) offset = -ends.methodStep.duration;
									stepToMove.offset += offset;
									stepToMove.position.top = stepToMove.offset*4 + 'px';
								}else{
									var adjustedOffset = ends.step.start - ends.methodStep.start;
									stepToMove.end += adjustedOffset;
								}
							}
						}else{
							if(!allowParallelOverlap){
								if(stepIndex <= step.index){
									if(offset == 0) offset = -ends.methodStep.duration;
									stepToMove.offset += offset;
									stepToMove.position.top = stepToMove.offset*4 + 'px';
								}else{
									stepToMove.end -= offset;
								}
							}
						}
					}
				});

				if(ctrl.stepToHold) ctrl.recipes[ctrl.stepToHold.recipe].steps[ctrl.stepToHold.index].merged = true;

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

				ctrl.holdCandidates = [];
				ctrl.stepToHold = null;
				ctrl.overlaps = [];


				if(loopThrough) ctrl.scanForOverlaps(loopThrough);
			},
			calculateEnds: function(step, methodStep, recipe){
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

				var minute = ctrl.roundToFive(moment().minute());
				if(minute == 60) minute = 0;
				var time = moment().set('minute', minute);
				if(minute == 0) time.add(1, 'hour');

				var newFinish = ctrl.roundToFive(moment(recipe.servingTime, 'Do MMMM, hh:mm a').diff(time, 'minutes'));
				var offset = newFinish - finish;

				ctrl.moveRecipe(recipeIndex, offset);

				ctrl.buildScale(true);
				ctrl.setupMethod();
			},
			isStepToHold: function(step){
				var isStepToHold = false;
				if(this.stepToHold) isStepToHold = step.index === this.stepToHold.index && step.recipe === this.stepToHold.recipe;
				return isStepToHold;
			},
			isOverlap: function(step){
				var overlapFound = false;
				angular.forEach(this.overlaps, function(overlap){
					if(step.index === overlap.index && step.recipe === overlap.recipe) overlapFound = true;
				});
				return overlapFound;
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
				var minute = this.roundToFive(moment().minute());
				if(minute == 60) minute = 0;
				var time = moment().set('minute', minute);
				if(minute == 0) time.add(1, 'hour');
				return time.add(increment, 'minutes').format('hh:mm');
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
			roundToFive: function(number){
				return Math.ceil(number/5)*5
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
