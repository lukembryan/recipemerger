'use strict';

angular.module('sous')
	.controller('recipesController', function($scope, $rootScope, $state, $timeout, menu, findInArray) {
    $scope.ctrl = {
			menu: menu,
			recipeAdded: function(id){
				var recipeAdded = findInArray($rootScope.menu.recipes, 'id', id);
        return recipeAdded !== null;
			}
		};
	});
