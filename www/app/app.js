'use strict';

angular.module('sous', [
  'ngResource',
  'ngAnimate',
  'ngSanitize',
  'ngMessages',
  'ui.router',
  'ui.event',
  'ui.bootstrap',
  'moment-picker'
])
	.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', 			    {url: '/', 									        templateUrl: 'app/screen/home/home.html'})
			.state('recipes', 			{url: '/recipes', 								  templateUrl: 'app/screen/recipes/recipes.html'})
			.state('cook', 			    {url: '/cook', 								      templateUrl: 'app/screen/cook/cook.html'})
			.state('admin', 			  {url: '/admin', 									  templateUrl: 'app/screen/admin/admin.html'});

    $locationProvider.html5Mode(true);
	})

	.factory('regex', function () {
    return {
      email: /^[a-zA-Z0-9\-_.@+]*$/
    };
	})

  .config(['momentPickerProvider', function (momentPickerProvider) {
    momentPickerProvider.options({
      /* Picker properties */
      locale:        'en',
      format:        'L LTS',
      minView:       'hour',
      maxView:       'minute',
      startView:     'year',
      autoclose:     true,
      today:         false,
      keyboard:      false,

      /* Extra: Views properties */
      leftArrow:     '&larr;',
      rightArrow:    '&rarr;',
      yearsFormat:   'YYYY',
      monthsFormat:  'MMM',
      daysFormat:    'D',
      hoursFormat:   'HH:[00]',
      minutesFormat: moment.localeData().longDateFormat('LT').replace(/[aA]/, ''),
      secondsFormat: 'ss',
      minutesStep:   5,
      secondsStep:   1
    });
  }])

	.controller('rootController', function($scope, $rootScope, $state, $transitions, $location, $timeout, $interval, $window, authentication, recipes, menu, findInArray, guid) {
    $transitions.onStart({}, function(){});

    $transitions.onSuccess({}, function(transition){
      $rootScope.state = transition.to().name;
    });

    var config = {
      apiKey: "AIzaSyAxt6H_sdMzVQ0dKcQ0SmHf9rqSgXgP98Q",
      authDomain: "sous-833df.firebaseapp.com",
      databaseURL: "https://sous-833df.firebaseio.com",
      projectId: "sous-833df",
      storageBucket: "sous-833df.appspot.com",
      messagingSenderId: "691654776185"
    };

    firebase.initializeApp(config);

    authentication.init();

    $rootScope.db = firebase.firestore();
    $rootScope.storage = firebase.storage();

    $rootScope.recipes = null;
    $rootScope.adminRecipes = null;
    $rootScope.menu = {
      recipes: []
    };
    $rootScope.currentRecipe = null;
    $rootScope.showMenu = false;

    $rootScope.loading = {
      show: false,
      label: ''
    };

    recipes.load();
	})

  .factory('authentication', function ($rootScope, $timeout){
    return {
      init: function(){
        firebase.auth().onAuthStateChanged(function(user){
          if(user){
            console.log('user', user);
          } else {
            console.log('signed out');
          }
        });

        firebase.auth().signInAnonymously().catch(function(error){
          var errorCode = error.code;
          var errorMessage = error.message;
        });
      }
    };
  })

	.factory('recipes', function ($rootScope, $timeout, menu){
		return {
      load: function(admin){
        var getImage = this.getImage, recipes;

        if(admin) recipes = $rootScope.db.collection('recipes');
        else recipes = $rootScope.db.collection('recipes').where('enabled', '==', true);

        $rootScope.loading = { show: true, label: 'loading recipes' };

        recipes.onSnapshot(function(querySnapshot){
          $timeout(function(){
            if(admin) $rootScope.adminRecipes = {};
            else $rootScope.recipes = {};

            querySnapshot.forEach(function(doc){
              var data = doc.data();
              $timeout(function(){ getImage(data); }, 0);

              if(admin) $rootScope.adminRecipes[doc.id] = data;
              else $rootScope.recipes[doc.id] = data;
            });

            $rootScope.loading = { show: false, label: '' };

            if(!admin) menu.load();
          }, 0);
        });
      },
			getImage: function(recipe){
				if(!recipe.image) recipe.image = 'recipe-photos/placeholder.png';

				var ref = $rootScope.storage.ref(recipe.image);

				ref.getDownloadURL().then(function(url){
					$timeout(function(){
						recipe.imageStyle = {'background-image': 'url(' + url + ')'};
					}, 0);
				}).catch(function(error){
				  switch(error.code){
				    case 'storage/object_not_found':
				      // File doesn't exist
				      break;
				    case 'storage/unauthorized':
				      // User doesn't have permission to access the object
				      break;
				    case 'storage/canceled':
				      // User canceled the upload
				      break;
				    case 'storage/unknown':
				      // Unknown error occurred, inspect the server response
				      break;
				  }
				});
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
	})

	.factory('menu', function ($rootScope, $timeout, findInArray){
		return {
      load: function(){
        var currentMenu = JSON.parse(localStorage.getItem('currentMenu'));
        if(currentMenu) $rootScope.menu = currentMenu;
      },
      save: function(){
        localStorage.setItem('currentMenu', JSON.stringify($rootScope.menu));
      },
      addRecipe: function(id){
        var recipeAdded = findInArray($rootScope.menu.recipes, 'id', id);
        if(recipeAdded !== null) return;

				var recipe = {
					id: id,
					currentStep: -1,
          servingTime: null
				};

				$rootScope.menu.recipes.push(recipe);
				this.save();
			},
      removeRecipe: function(id){
        var recipe = findInArray($rootScope.menu.recipes, 'id', id);
				$rootScope.menu.recipes.splice(recipe, 1);
				this.save();

        $rootScope.$emit('recipeRemoved', recipe);
			}
		}
	})

  .directive('recipePanel', function($timeout, $rootScope){
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'app/widget/recipe-panel/recipe-panel.html',
			scope: true,
			link: function(scope){
        scope.recipePanel = {
          data: null
        };

				$rootScope.$watch('currentRecipe', function(currentRecipe){
					scope.recipePanel.data = currentRecipe;
				}, true);
			}
		};
	})

  .directive('menuPanel', function($timeout, $rootScope, menu, findInArray){
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'app/widget/menu-panel/menu-panel.html',
			scope: true,
			link: function(scope){
        scope.menuPanel = {
          menu: null,
          data: [],
          servingTimeChange: function(id, servingTime){
            var foundRecipe = findInArray($rootScope.menu.recipes, 'id', id);
    				if(foundRecipe !== null) foundRecipe = $rootScope.menu.recipes[foundRecipe];

            if(foundRecipe.servingTime !== servingTime){
              foundRecipe.servingTime = servingTime;
              menu.save();

              $rootScope.$emit('servingTimeChange', {id: id, servingTime: servingTime});
            }
          }
        };

        scope.menu = menu;

				$rootScope.$watch('menu', function(menu){
					scope.menuPanel.menu = menu;

          scope.menuPanel.data = [];

          if($rootScope.recipes){
  					scope.processRecipes();
  				}
				}, true);

        scope.processRecipes = function(){
          angular.forEach($rootScope.menu.recipes, function(recipe){
            var recipeToAdd = $rootScope.recipes[recipe.id];
            recipeToAdd.id = recipe.id;
            recipeToAdd.currentStep = recipe.currentStep;
            recipeToAdd.servingTime = recipe.servingTime;
            scope.menuPanel.data.push(recipeToAdd);
          });
        };
			}
		};
	})

	.factory('guid', function(){
		return function(){
			function s4(){
				return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		};
	})

	.factory('findInArray', function($timeout, $window) {
		return function(array, property, value){
			var found = null;
      if(angular.isArray(array)){
        for (var i = 0; i < array.length; i++) {
          if(array[i][property] == value) found = i;
        }
      }
			return found;
		};
	})

	.factory('toTitleCase', function() {
		return function(string){
			if(string) return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			else return string;
		};
	});
