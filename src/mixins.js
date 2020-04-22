const fb = require('./firebase.js');

import moment from 'moment';

export default {
  data: function () {
    return {
      servingTime: '',
      parallelTime: {},
      progress: {
        id: null,
        currentStep: 0,
        timer: {
          step: null,
          duration: 0,
          started: null,
          timeAdded: 0,
          show: false
        }
      }
    }
  },
  computed: {
    page: function(){
      return this.$store.state.page;
    },
    recipes: function(){
      return this.$store.state.recipes;
    },
    recipe: function(){
      return this.$store.state.recipe;
    }
  },
  methods: {
    getImage: function(recipe, callback){
      if(!recipe.details.image) recipe.details.image = 'recipe-photos/placeholder.png';

      var ref = fb.storage.ref(recipe.details.image);

      ref.getDownloadURL().then(function(url){
        recipe.details.imageStyle = {'background-image': 'url(' + url + ')'};
        if(callback) callback(recipe.details.imageStyle);
      }).catch(function(error){
        console.log('getDownloadURL', error);
        recipe.details.imageStyle = {'background-image': 'none'};
      });
    },
    findIngredient: function(ingredient, recipe){
      var foundIngredient = null;
      if(recipe.ingredients[ingredient.component]){
        foundIngredient = recipe.ingredients[ingredient.component].list[ingredient.ingredient];
      }
      return foundIngredient;
    },
    calcServingTime: function(currentRecipe, mode, update){
      var recipeTime = 0;
      this.parallelTime = {};

      var included = !update;

      if(!currentRecipe) return;
      for(var i=0; i<currentRecipe.steps.length; i++){
        var currentStep = currentRecipe.steps[i];
        var previousStep = currentRecipe.steps[i-1];
        //var nextStep = currentRecipe.steps[i+1];

        if(update) included = update && this.progress.currentStep <= i;

        // LOGGING
        /*
        var stepSummary = (i+1) + ': ';
        if(currentStep.setupDuration) stepSummary += 'setup:' + currentStep.setupDuration + ' + ';
        stepSummary += 'duration:' + currentStep.duration;
        if(currentStep.parallel) stepSummary += ' | parallel';
        if(currentStep.dependsOn !== null){
          stepSummary += ' | depends on ';
          stepSummary += currentStep.dependsOn+1;
         }
        console.log(stepSummary);
        */
        // LOGGING

        if(currentStep.parallel){
          // current step has parallel component

          this.parallelTime[i] = parseInt(currentStep.duration); // add parallel time for use

          if(previousStep && previousStep.parallel){
            // previous step has parallel time
            if(currentStep.dependsOn !== null) this.parallelTime[currentStep.dependsOn] = 0; // remove parallel time of dependent step
            if(included) recipeTime += this.useParallelTime(currentStep.setupDuration, i) + currentStep.duration;
          }else{
            // previous step doesn't have parallel time
            if(included) recipeTime += currentStep.setupDuration + currentStep.duration; // add all step durations
          }
        }else{
          // current step doesn't have parallel component
          if(currentStep.dependsOn !== null) this.parallelTime[currentStep.dependsOn] = 0; // remove parallel time of dependent step
          if(included) recipeTime += this.useParallelTime(currentStep.duration, i); // use any available parallel time
        }

        //console.log('recipeTime', recipeTime, 'parallelTime', this.parallelTime);
      }

      this.servingTime = mode == 'time' ? moment().add(recipeTime, 'minutes').format('h:mm A') : recipeTime;
    },
    calcTimeLeft: function(timer){
      var duration = timer.duration + parseInt(timer.timeAdded);
      var finishTime = moment(timer.started).add(duration, 'm');
      var secondsLeft = -moment().diff(finishTime, 'seconds');
      return secondsLeft;
    },
    showHoursMinutes: function(totalMinutes) {
      var hours = Math.floor(totalMinutes / 60);
      var minutes = totalMinutes % 60;
      var time = '';
      time += hours > 0 ? hours + (hours === 1 ? ' hour' : ' hours') : '';
      time += minutes > 0 ? ' ' + minutes + (minutes === 1 ? ' minute' : ' minutes') : '';
      return time;
    },
    useParallelTime: function(duration, currentStep){
      duration = parseInt(duration);
      var parallelTimeUsed = 0;
      var parallelTime = this.parallelTime;

      Object.keys(parallelTime).sort().reverse().forEach(function(parallelStep){
        parallelStep = parseInt(parallelStep);

        if(parallelStep < currentStep && parallelTime[parallelStep] > 0 && parallelTimeUsed === 0){
          if(parallelTime[parallelStep] >= duration){
            parallelTimeUsed = duration;
          }else{
            parallelTimeUsed = parallelTime[parallelStep];
          }

          parallelTime[parallelStep] -= parallelTimeUsed;
        }
      });

        return duration - parallelTimeUsed; // duration to add to recipe time is what is left after parallel time used
      },
    getProgress: function(){
      var progress = localStorage.getItem('progress');
      if(progress){
        this.progress = JSON.parse(progress);
        this.$store.dispatch('loadSelectedRecipe', this.progress.id);
      }
    },
    clone: function(original){
      var copy = JSON.stringify(original);
      return JSON.parse(copy);
    }
  },
  created: function(){
    window.addEventListener('keydown', this.handleKeyPress);
    this.getProgress();
  }
};
