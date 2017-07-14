'use strict';

angular.module('recipeMerger')
	.controller('homeController', function($scope, $rootScope, $state, $timeout, recipes) {
	    $scope.home = {
				menu: [],
				menuStart: null,
				menuFinish: null,
				timeScale: [],
				notches: 0,
				merge: function(){
					this.menu = [];
					this.timeScale = [];

					angular.forEach($rootScope.data, function(recipe){
						var minute = 5 * Math.round(moment(recipe.finishTime).minute()/5);
						recipe.finishTime = moment(recipe.finishTime).set({'minute': minute});
					});

					var recipes = angular.copy($rootScope.data);

					recipes.sort(function(a ,b){ return new Date(b.finishTime) - new Date(a.finishTime); });

					this.menuFinish = moment(recipes[0].finishTime);

					angular.forEach($rootScope.data, function(recipe, recipeNumber){
						var stepFinish = moment(angular.copy(recipe.finishTime));
						var steps = angular.copy(recipe.steps).reverse();

						angular.forEach(steps, function(step, stepNumber){
							step.recipe = recipeNumber;
							step.number = steps.length - stepNumber - 1;

							$scope.home.setStepTime(step, stepFinish);

							//console.log(step.recipe, step.number, step.parallel, step.follow, step.startTime.format('hh:mm'), step.finishTime.format('hh:mm'), step.offset);

							$scope.home.menu.push(step);

							stepFinish.subtract(step.duration, 'minutes');
						});
					});

					this.checkOverlaps();
				},
				setStepTime: function(step, stepFinish){
					step.startTime = angular.copy(stepFinish).subtract(step.duration, 'minutes');
					step.finishTime = angular.copy(stepFinish);
					step.offset = moment($scope.home.menuFinish).diff(step.finishTime, 'minutes');
				},
				setupTimeScale: function(){
					var menu = angular.copy(this.menu);

					menu.sort(function(a ,b){ return new Date(a.startTime) - new Date(b.startTime); });

					this.menuStart = menu[0].finishTime.subtract(menu[0].duration, 'minutes');
					this.notches = this.menuFinish.diff(this.menuStart, 'minutes')/5;

					for(var i=0; i<this.notches + 1; i++){
						var newNotch = angular.copy(this.menuFinish);
						this.timeScale.push(newNotch.subtract(5*i, 'minutes').format());
					}
				},
				checkOverlaps: function(){
					angular.forEach($scope.home.menu, function(step, stepNumber){
						angular.forEach($scope.home.menu, function(stepCheck, stepCheckNumber){
							if(stepNumber !== stepCheckNumber){
								var startOverlap = moment(step.startTime).isBetween(stepCheck.startTime, stepCheck.finishTime, 'minute', '[)');
								var finishOverlap = moment(step.finishTime).isBetween(stepCheck.startTime, stepCheck.finishTime, 'minute', '(]');
								var stepTime = (step.recipe + 1) + '|' + (step.number + 1);
								var checkRange = (stepCheck.recipe + 1) + '|' + (stepCheck.number + 1);

								if(startOverlap || finishOverlap){
									//if(startOverlap) console.log(stepTime, 'startTime:' + step.startTime.format('hh:mm'), checkRange, 'range:' + stepCheck.startTime.format('hh:mm') + '-' + stepCheck.finishTime.format('hh:mm'));
									//if(finishOverlap) console.log(stepTime, 'finishTime:' + step.finishTime.format('hh:mm'), checkRange, 'range:' + stepCheck.startTime.format('hh:mm') + '-' + stepCheck.finishTime.format('hh:mm'));
									$scope.home.setStepTime(step, stepCheck.startTime);
								}
							}
						});
					});

					this.setupTimeScale();
				}
			};

	    //recipes.fromFile(1);
	    recipes.fromFile(2);
	    recipes.fromFile(3);
	});
