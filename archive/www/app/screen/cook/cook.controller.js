'use strict';

angular.module('sous')
	.controller('cookController', function($scope, $rootScope, $state, $timeout, recipes, menu, findInArray) {
    $scope.ctrl = {
			menu: menu,
			recipes: [],
			method: [],
			mergedMethod: [],
			currentMethodStep: -1,
			cooking: false,
			scale: [],
			scaleIncrement: 5,
			methodStart: null,
			methodFinish: null,
			minFinishTime: null,
			holdCandidates: [],
			stepToHold: null,
			overlaps: [],
			sameRecipeOverlaps: [],
			visualise: false,
			activeIngredientsTab: 0,
			init: function(force){
				var ctrl = this;
				ctrl.recipes = [];

				//if(force) $rootScope.loading = { show: true, label: 'merging recipes' };

				if($rootScope.recipes){
					angular.forEach($rootScope.menu.recipes, function(recipe){
						var recipeToAdd = angular.copy($rootScope.recipes[recipe.id]);
						recipeToAdd.id = recipe.id;
						recipeToAdd.currentStep = recipe.currentStep;
						ctrl.recipes.push(recipeToAdd);
					});
				}else{
					var cancelWatch = $rootScope.$watch('recipes', function(recipes){
						if(recipes){
							ctrl.init();
							cancelWatch();
						}
					}, false);
				}

				//ctrl.buildRecipes(force);
				ctrl.buildRecipes();
			},
			buildRecipes: function(forceMerge){
				var ctrl = this;

				var setIndexes = function(step, stepIndex, recipe, recipeIndex){
					step.index = stepIndex;
					step.recipe = recipeIndex;
				};

				var setStepPositions = function(step, stepIndex, recipe){
					step = ctrl.stepPosition(step, stepIndex, recipe);
				};

				var calcRecipeEnds = function(step, stepIndex, recipe){
					if(recipe.end === undefined) recipe.end = 0;
					if(step.end > recipe.end) recipe.end = step.end;
				};

				ctrl.processRecipe(setIndexes);
				ctrl.processRecipe(setStepPositions);
				ctrl.processRecipe(calcRecipeEnds);

				ctrl.buildScale();
				ctrl.setupMethod();

				if($rootScope.menu.recipes.length > 0){
					angular.forEach(ctrl.recipes, function(recipe, index){
						var savedRecipe = $rootScope.menu.recipes[index];
						if(recipe.id === savedRecipe.id) ctrl.servingTimeChange({id: savedRecipe.id, servingTime: savedRecipe.servingTime});
					});

					if(!ctrl.visualise || forceMerge) ctrl.merge();
				}
			},
			merge: function(){
				this.scanForOverlaps(true);
				$rootScope.loading = { show: false, label: '' };
			},
			buildScale: function(update){
				var ctrl = this, start = 0, finish = 0, updateTimer;

				var findFinish = function(step, stepIndex, recipe, recipeIndex){
					var stepFinish = step.end + recipe.steps[0].offset;
					if(stepFinish > finish) finish = stepFinish;

					if(stepIndex == recipe.steps.length-1){
						var finishTime = moment().add(finish, 'minutes');
						//if(!update) recipe.servingTime = finishTime.format('Do MMM, hh:mm a');
						recipe.servingTime = finishTime.format('Do MMM, hh:mm a');
					}
				};

				var findRecipeFinishes = function(recipe, recipeIndex){
					var lastStep = recipe.steps[recipe.steps.length - 1];
					var recipeFinish = lastStep.end + recipe.steps[0].offset;

					var finishTime = moment().add(recipeFinish, 'minutes');
					recipe.servingTime = finishTime.format('Do MMM, hh:mm a');
				};

				var findStart = function(recipe, recipeIndex){
					if(recipe.offset !== null){
						if(recipe.offset < start) start = recipe.offset;
					}
				};

				ctrl.processRecipe(findFinish);
				ctrl.processRecipe(null, findRecipeFinishes);

				start = finish;
				ctrl.processRecipe(null, findStart);

				ctrl.methodStart = start === 0 ? null : moment().add(start, 'minutes').format('Do MMM, hh:mm a');
				ctrl.methodFinish = moment().add(finish, 'minutes').format('Do MMM, hh:mm a');

				ctrl.scale = [0];

				var minute = moment().minute(), scaleOffset = 0;
				if(minute % 5 > 0) scaleOffset = 5 - (minute % 5);

				for(var i = 1; i*ctrl.scaleIncrement <= (finish + ctrl.scaleIncrement); i++){
					if(scaleOffset > 0){
						if(i === 1){
							ctrl.scale.push(scaleOffset);
						}else{
							var adjustedIndex = i - 1;
							var minuteMark = (adjustedIndex*ctrl.scaleIncrement) + scaleOffset;
							ctrl.scale.push(minuteMark);
						}
					}else{
						ctrl.scale.push(i*ctrl.scaleIncrement);
					}
				}

				if(updateTimer) $timeout.cancel(updateTimer);
				updateTimer = $timeout(function(){
					ctrl.buildScale(true);
				}, 5000);
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
				}else{
					ctrl.processMergedMethod();
				}
			},
			fixOverlaps: function(loopThrough){
				var ctrl = this, overlapDuration = 0;
				if(ctrl.stepToHold) overlapDuration = angular.copy(ctrl.stepToHold.duration);

				// remove hold recipe steps from allowed overlap duration
				angular.forEach(ctrl.sameRecipeOverlaps, function(step){
					overlapDuration -= step.duration;
				});

				// sort remaining hold candidates longest to shortest duration
				ctrl.holdCandidates.sort(function(a, b){ return new Date(b.duration) - new Date(a.duration); });

				angular.forEach(ctrl.holdCandidates, function(holdCandidate, index){
					if(ctrl.stepToHold.parallel && !holdCandidate.parallel && holdCandidate.duration <= overlapDuration){
						// holding parallel step, remaining hold candidate is not parallel and is within the remaining allowed overlap duration
						holdCandidate.allowOverlap = true;
						holdCandidate.overlapOffset = 0;

						angular.forEach(ctrl.holdCandidates, function(otherHoldCandidate){
							if(otherHoldCandidate.otherAllowedOverlaps){
								angular.forEach(otherHoldCandidate.otherAllowedOverlaps, function(otherAllowedOverlap){
										holdCandidate.overlapOffset += ctrl.recipes[otherHoldCandidate.recipe].steps[otherAllowedOverlap].duration;
								});
							}
						});

						var stopOverlapping = false;

						for(var stepIndex = ctrl.recipes[holdCandidate.recipe].steps.length - 1; stepIndex >= 0; stepIndex--){
							var holdCandidateStep = ctrl.recipes[holdCandidate.recipe].steps[stepIndex];

							if(holdCandidateStep.index <= holdCandidate.index && !stopOverlapping){
								if(overlapDuration >= holdCandidateStep.duration && !holdCandidateStep.parallel){
									overlapDuration -= holdCandidateStep.duration;
									if(!holdCandidate.otherAllowedOverlaps) holdCandidate.otherAllowedOverlaps = [];
									holdCandidate.otherAllowedOverlaps.push(stepIndex);
								}else{
									stopOverlapping = true;
								}
							}
						}
					}

					if(!ctrl.stepToHold.parallel && holdCandidate.parallel){
						var endOffset =  holdCandidate.end - ctrl.stepToHold.end;
						holdCandidate.allowParallelOverlap = holdCandidate.duration > (ctrl.stepToHold.duration + endOffset);
					}
				});

				ctrl.overlaps.sort(function(a, b){ return new Date(b.duration) - new Date(a.duration); });

				angular.forEach(ctrl.overlaps, function(step){
					var recipe = ctrl.recipes[step.recipe];
					var ends = ctrl.calculateEnds(step, ctrl.stepToHold, recipe);
					var offset = ends.methodStep.duration - (ends.methodStep.finish - ends.step.finish);
					var allowOverlap = false;
					var otherAllowedOverlaps = [];
					var allowParallelOverlap = false;
					var overlapOffset = 0;

					angular.forEach(ctrl.holdCandidates, function(holdCandidate){
						if(holdCandidate.recipe == step.recipe && holdCandidate.index == step.index){
							if(holdCandidate.allowOverlap) allowOverlap = true;
							if(holdCandidate.otherAllowedOverlaps) otherAllowedOverlaps = holdCandidate.otherAllowedOverlaps;
							if(holdCandidate.allowParallelOverlap) allowParallelOverlap = true;
							overlapOffset = holdCandidate.overlapOffset !== undefined ? holdCandidate.overlapOffset : 0;
						}
					});

					for(var stepIndex = recipe.steps.length - 1; stepIndex >= 0; stepIndex--){
						var stepToMove = recipe.steps[stepIndex];
						var currentEnds = ctrl.calculateEnds(stepToMove, ctrl.stepToHold, ctrl.recipes[stepToMove.recipe]);
						var id = (stepToMove.recipe+1) + ':' + (stepToMove.index+1);

						if(allowOverlap){
							// step can overlap held parallel step
							if(stepIndex == step.index){
								// step in overlapping step's recipe is the overlapping step
								stepToMove.offset -= overlapOffset;
								stepToMove.merged = true;
							}else{
								if(stepIndex < step.index){
									// step in overlapping step's recipe is before overlapping step
									if(!stepToMove.parallel && otherAllowedOverlaps.indexOf(stepToMove.index) >= 0){
										// not a parallel step & overlap space remaining
										//overlapOffset += stepToMove.duration;
										stepToMove.offset -= overlapOffset;
										stepToMove.end -= overlapOffset;
										stepToMove.merged = true;
									}else{
										// can't overlap this step
										console.log(id, 'before overlapping step, cannot overlap');
										//overlapOffset -= ends.methodStep.duration;
										//stepToMove.offset -= overlapOffset;
										if(stepToMove.index === 0) stepToMove.offset -= currentEnds.step.finish - currentEnds.methodStep.start;
										stepToMove.end -= currentEnds.step.finish - currentEnds.methodStep.start;
										stepToMove.position.top = stepToMove.offset*4 + 'px';
									}
								}else{
									// step in overlapping step's recipe is after overlapping step
									console.log(id, 'after overlapping step');
									console.log('stepToMove.end', stepToMove.end);
									console.log('overlapOffset', overlapOffset);
									stepToMove.end += overlapOffset;
								}
							}
						}else{
							// step can't overlap held step
							if(!allowParallelOverlap){
								if(stepIndex <= step.index){
									// step in overlapping step's recipe is before or equal to overlapping step
									stepToMove.offset -= offset;
									stepToMove.position.top = stepToMove.offset*4 + 'px';
								}else{
									// step in overlaping step's recipe is after overlapping step
									stepToMove.end += offset;
								}
							}
						}

						/*
						if(allowOverlap){
							// step can overlap held parallel step
							if(stepIndex == step.index){
								// step in overlapping step's recipe is the overlapping step
								console.log(id, 'overlapping step');

								offset += stepToMove.duration;
								stepToMove.offset -= overlapOffset;
								stepToMove.end = (step.index == 0 ? 0 : offset) + overlapOffset;
								overlapDuration -= stepToMove.duration;
								stepToMove.merged = true;
							}else{
								if(stepIndex < step.index){
									// step in overlapping step's recipe is before overlapping step
									console.log(id, 'before overlapping step');
									if(!stepToMove.parallel && overlapDuration > stepToMove.duration){
										overlapDuration -= stepToMove.duration;
										stepToMove.merged = true;
										offset += stepToMove.duration;
									}else{
										if(offset == 0) offset = -ends.methodStep.duration;
										stepToMove.offset += offset;
										stepToMove.position.top = stepToMove.offset*4 + 'px';
									}
								}else{
									// step in overlapping step's recipe is after overlapping step
									console.log(id, 'after overlapping step');

									console.log('overlapping step start', ends.step.start, 'hold step start', ends.methodStep.start);

									var adjustedOffset = ends.step.start - ends.methodStep.start;
									if(step.index > 0) stepToMove.end += adjustedOffset;
								}
							}
						}else{
							// step can't overlap held step
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
						*/
					}
				});

				if(ctrl.stepToHold) ctrl.recipes[ctrl.stepToHold.recipe].steps[ctrl.stepToHold.index].merged = true;

				ctrl.adjustRecipesOnScale();

				ctrl.buildScale(true);
				ctrl.setupMethod();

				ctrl.holdCandidates = [];
				ctrl.stepToHold = null;
				ctrl.overlaps = [];

				if(loopThrough) ctrl.scanForOverlaps(loopThrough);
			},
			adjustRecipesOnScale: function(move){
				var ctrl = this;

				function calculateAdjustment(){
					var adjust = 0;
					ctrl.processRecipe(function(step, stepIndex, recipe, recipeIndex){
						var stepCompleted, previousStepCompleted;

						if(move === undefined || move === -1){
							stepCompleted = $rootScope.menu.recipes[recipeIndex].currentStep > stepIndex;

							if(stepCompleted){
								if(step.offset > 0 && step.offset > adjust) adjust = step.offset;
							}else{
								if(step.offset < 0 && step.offset < adjust) adjust = step.offset;
							}
						}else{
							/*
							var previousStep = ctrl.mergedMethod[ctrl.currentMethodStep - 1];

							if(previousStep){
								if(previousStep.offset === 0){
									adjust = previousStep.parallel ? previousStep.setupDuration : previousStep.duration;
								}
							}
							*/
						}
					});

					return -adjust;
				}

				var adjustRecipes = calculateAdjustment();

				ctrl.processRecipe(null, function(recipe, recipeIndex){
					ctrl.moveRecipe(recipeIndex, adjustRecipes);
					recipe.offset = recipe.steps[0].offset;
				});
			},
			processMergedMethod: function(){
				var ctrl = this;

				ctrl.mergedMethod = [];

				angular.forEach(ctrl.recipes, function(recipe){
					ctrl.mergedMethod = ctrl.mergedMethod.concat(recipe.steps);
				});

				ctrl.mergedMethod.sort(function(a ,b){ return new Date(a.offset) - new Date(b.offset); });

				var currentStepFound = false;
				angular.forEach(ctrl.mergedMethod, function(step, index){
					angular.forEach($rootScope.menu.recipes, function(recipe, recipeIndex){
						if(!currentStepFound){
							if(step.recipe === recipeIndex && recipe.currentStep === step.index){
								ctrl.currentMethodStep = index;
								currentStepFound = true;
							}
						}
					});
				});

				var finishedRecipes = 0;
				angular.forEach($rootScope.menu.recipes, function(recipe, recipeIndex){
					if(recipe.currentStep === ctrl.recipes[recipeIndex].steps.length) finishedRecipes++;
				});

				if(finishedRecipes === $rootScope.menu.recipes.length) ctrl.currentMethodStep = ctrl.mergedMethod.length;
			},
			calculateEnds: function(step, methodStep, recipe){
				var ctrl = this;
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
			servingTimeChange: function(data){
				var ctrl = this, recipe;

				var foundRecipe = findInArray(ctrl.recipes, 'id', data.id);
				if(foundRecipe !== null) recipe = ctrl.recipes[foundRecipe];
				else return;

				recipe.servingTime = data.servingTime;

				var finish = 0;
				angular.forEach(recipe.steps, function(step){
					var stepFinish = step.end + recipe.steps[0].offset;
					if(stepFinish > finish) finish = stepFinish;
				});

				var newFinish = moment(recipe.servingTime, 'Do MMM, hh:mm a').diff(moment(), 'minutes');
				var offset = newFinish - finish;

				ctrl.moveRecipe(foundRecipe, offset);
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
				var multiplier = 4;
				var position = {height: 0, top: 0};
				if(step.offset === undefined) step.offset = 0;

				var previousStep = index > 0 ? recipe.steps[index-1] : null;

				if(!step.parallel) position.height = step.duration*multiplier + 'px';
				else position.height = (step.duration + step.setupDuration)*multiplier + 'px';

				if(previousStep){
					step.offset += previousStep.offset;

					if(previousStep.parallel){
						step.offset += previousStep.setupDuration;
						if(step.dependsOn || step.parallel) step.offset += previousStep.duration;
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
					}
					position.top = step.offset*multiplier + 'px';
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
				var time = moment();
				return time.add(increment, 'minutes').format('hh:mm');
			},
			isCurrentStep: function(step){
				var ctrl = this, isCurrentStep = false;

				var inProgress = [-1, ctrl.mergedMethod.length].indexOf(ctrl.currentMethodStep) < 0;

				if(inProgress){
					var currentMethodStep = ctrl.mergedMethod[ctrl.currentMethodStep];
					isCurrentStep = currentMethodStep.recipe === step.recipe && currentMethodStep.index === step.index;
				}

				return isCurrentStep;
			},
			isCompleted: function(step){
				var ctrl = this, isCompleted = false, currentStep = -1;

				var recipe = findInArray($rootScope.menu.recipes, 'id', ctrl.recipes[step.recipe].id);

				if(recipe !== null) currentStep = $rootScope.menu.recipes[recipe].currentStep;

				if(currentStep > step.index) isCompleted = true;

				return isCompleted;
			},
			isIssue: function(step){
				var ctrl = this;

				var isIssue = (ctrl.recipes[step.recipe].steps[0].offset + step.end - step.offset) !== step.duration + step.setupDuration;

				return isIssue;
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
			methodNavigate: function(move){
				var ctrl = this, moveAllowed, recipe, previousRecipe;

				if(move === 1) moveAllowed = ctrl.currentMethodStep < ctrl.mergedMethod.length;
				else moveAllowed = ctrl.currentMethodStep >= 0;

				if(moveAllowed){
					ctrl.currentMethodStep += move;
					var previousMethodStep = ctrl.currentMethodStep - move;

					previousRecipe = [-1, ctrl.mergedMethod.length].indexOf(previousMethodStep) < 0 ? $rootScope.menu.recipes[ctrl.mergedMethod[previousMethodStep].recipe] : null;
					recipe = [-1, ctrl.mergedMethod.length].indexOf(ctrl.currentMethodStep) < 0 ? $rootScope.menu.recipes[ctrl.mergedMethod[ctrl.currentMethodStep].recipe] : null;

					var previousSameAsCurrent = false;
					if(recipe && previousRecipe) previousSameAsCurrent = ctrl.mergedMethod[previousMethodStep].recipe === ctrl.mergedMethod[ctrl.currentMethodStep].recipe;

					if(move === 1){
						if(previousRecipe) previousRecipe.currentStep++;
						if(recipe && recipe.currentStep === -1) recipe.currentStep++;
					}else{
						var sameRecipe = false;
						if(recipe && previousRecipe) sameRecipe = recipe.id === previousRecipe.id;

						if(recipe) recipe.currentStep--;
						if(previousRecipe && !sameRecipe){
							if(previousRecipe.currentStep === ctrl.recipes[ctrl.mergedMethod[previousMethodStep].recipe].steps.length) previousRecipe.currentStep--;
							if(previousRecipe.currentStep === 0) previousRecipe.currentStep = -1;
						}
					}

					ctrl.activeIngredientsTab = 0;

					menu.save();

					ctrl.adjustRecipesOnScale(move);
					ctrl.buildScale(true);
					ctrl.setupMethod();
				}
			},
			toggleCooking: function(){
				var ctrl = this;
				ctrl.cooking = !ctrl.cooking;
			}
		};

		$rootScope.$on('servingTimeChange', function(event, data){
			$scope.ctrl.init();
			$scope.ctrl.servingTimeChange(data);
			$scope.ctrl.merge();

			angular.forEach($rootScope.menu.recipes, function(recipe){
				recipe.currentStep = -1;
			});

			$scope.ctrl.currentMethodStep = -1;
		});

		$rootScope.$on('recipeRemoved', function(event, recipe){
			$scope.ctrl.init();
			$scope.ctrl.merge();
		});
	});
