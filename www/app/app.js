'use strict';

angular.module('recipeMerger', [
  'ngResource',
  'ngAnimate',
  'ngSanitize',
  'ngMessages',
  'ui.router',
  'ui.event',
  'ui.bootstrap'
])
	.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', 			    {url: '/', 									       templateUrl: 'app/screen/home/home.html'})

    $locationProvider.html5Mode(true);
	})

	.factory('regex', function () {
    return {
      email: /^[a-zA-Z0-9\-_.@+]*$/
    };
	})

	.controller('rootController', function($scope, $rootScope, $state, $location, $resource, $q, $timeout, $interval, $window, recipes, findInArray, guid) {
    recipes.fromFile(0);

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

		});

		$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){

		});
	})

	.factory('recipes', function ($rootScope, $q, $resource, $window){
		return {
      fromFile: function(recipeId){
        this.resource(recipeId).then(function(success){
          console.log('recipes.fromFile', success);
        },function(error){
          console.log('recipes.fromFile', error);
        });
      },
      resource: function(recipeId){
				var deferred = $q.defer(), promise = deferred.promise;

				var recipe = $resource('app/data/' + recipeId + '.json', {},
						{'get': {method: 'GET', headers: {'Content-Type': 'application/json'}, timeout: 20000, isArray: false}}
				);

				recipe.get(
					{},
					function(success) {
						deferred.resolve(success);
					},
					function(error){
						deferred.reject(error);
					}
				);

				return promise;
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
