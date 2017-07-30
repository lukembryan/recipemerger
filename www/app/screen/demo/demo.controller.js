'use strict';

angular.module('recipeMerger')
	.controller('demoController', function($scope, $rootScope, $state, $timeout, recipes) {
	    $scope.demo = {
				menu: [],
				menuStart: null,
				menuFinish: null,
				timeScale: [],
				stepFinishes: [],
				recipeFinishes: [],
				notches: 0,
				merge: function(){
					this.menu = [];

					var mostSteps = 0;
					this.stepFinishes = [];

					angular.forEach($rootScope.data, function(recipe, recipeNumber){
						var minute = 5 * Math.round(moment(recipe.finishTime).minute()/5);
						recipe.finishTime = moment(recipe.finishTime).set({'minute': minute});

						if(recipe.steps.length > mostSteps) mostSteps = recipe.steps.length;

						$scope.demo.stepFinishes[recipeNumber] = angular.copy(recipe.finishTime);
					});

					this.recipeFinishes = angular.copy(this.stepFinishes);

					var recipes = angular.copy($rootScope.data);

					recipes.sort(function(a ,b){ return new Date(b.finishTime) - new Date(a.finishTime); });

					this.menuFinish = moment(recipes[0].finishTime);

					for(var i=0; i<mostSteps; i++){
						angular.forEach($rootScope.data, function(recipe, recipeNumber){
							var steps = angular.copy(recipe.steps).reverse();

							if(steps[i]){
								steps[i].recipe = recipeNumber;
								steps[i].number = steps.length - i - 1;

								//console.log(i, steps[i].description);

								var shift = 0;

								if(steps[i].wait && steps[i].overlap){
									//console.log((steps[i].recipe + 1) + ' - ' + (steps[i].number + 1) + ' wait, overlap: ' + steps[i].overlap);
									angular.forEach(steps[i].overlap, function(overlapStep){
										//console.log(i, overlapStep, steps.length - overlapStep - 1);
										overlapStep = steps.length - overlapStep - 1;
										shift += steps[overlapStep].duration;
									});
									//console.log('shift', shift);
								}

								$scope.demo.setStepTime(steps[i], $scope.demo.stepFinishes[recipeNumber].add(shift, 'minutes'));

								var stepIndex = $scope.demo.menu.push(steps[i]) - 1;

								$scope.demo.stepFinishes[recipeNumber].subtract(steps[i].duration, 'minutes');
								$scope.demo.checkOverlaps(stepIndex, steps[i]);
							}
						});
					}
				},
				stepFinishOffset: function(finish){
					return moment($scope.demo.menuFinish).diff(finish, 'minutes') - 5;
				},
				setStepTime: function(step, stepFinish){
					step.startTime = angular.copy(stepFinish).subtract(step.duration, 'minutes');
					step.finishTime = angular.copy(stepFinish);
					step.offset = moment($scope.demo.menuFinish).diff(step.finishTime, 'minutes');
				},
				setupTimeScale: function(){
					this.timeScale = [];
					var menu = angular.copy(this.menu);

					menu.sort(function(a ,b){ return new Date(a.startTime) - new Date(b.startTime); });

					this.menuStart = menu[0].finishTime.subtract(menu[0].duration, 'minutes');
					this.notches = this.menuFinish.diff(this.menuStart, 'minutes')/5;

					for(var i=0; i<this.notches + 1; i++){
						var newNotch = angular.copy(this.menuFinish);
						this.timeScale.push(newNotch.subtract(5*i, 'minutes').format());
					}
				},
				checkOverlaps: function(stepIndex, stepToCheck){
					var recipeCount = $rootScope.data.length;

					for(var i=0; i<recipeCount; i++){
						angular.forEach($scope.demo.menu, function(step, stepNumber){
							if(stepIndex !== stepNumber){
								var startOverlap = moment(stepToCheck.startTime).isBetween(step.startTime, step.finishTime, 'minute', '[)');
								var finishOverlap = moment(stepToCheck.finishTime).isBetween(step.startTime, step.finishTime, 'minute', '(]');
								var allOverlap = moment(stepToCheck.startTime).isSameOrBefore(step.startTime) && moment(stepToCheck.finishTime).isSameOrAfter(step.finishTime);

								var stepTime = (stepToCheck.recipe + 1) + '|' + (stepToCheck.number + 1);
								var checkRange = (step.recipe + 1) + '|' + (step.number + 1);

								if(startOverlap || finishOverlap || allOverlap){
									if(!stepToCheck.wait || (stepToCheck.wait && step.wait)){
										//console.log(stepTime, stepToCheck.startTime.format('hh:mm'), stepToCheck.finishTime.format('hh:mm'), ' - ', checkRange, step.startTime.format('hh:mm'), step.finishTime.format('hh:mm'));
										$scope.demo.setStepTime(stepToCheck, step.startTime);
										//console.log('new range', stepToCheck.startTime.format('hh:mm'), stepToCheck.finishTime.format('hh:mm'));
										//console.log('--------');
										//$scope.demo.stepFinishes[stepToCheck.recipe] = angular.copy(step.startTime).subtract(stepToCheck.duration, 'minutes');
									}
								}
							}
						});
					}

					this.setupTimeScale();
				}
			};

	    recipes.fromFile('demo/1');
	    recipes.fromFile('demo/2');
	    recipes.fromFile('demo/3');
	});
