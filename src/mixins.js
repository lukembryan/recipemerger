const fb = require('./firebase.js');

import moment from 'moment';

export default {
  data: function () {
    return {
      dev: window.location.host == 'localhost:8080' ? true : false,
      servingTime: '',
      recipeDuration: 0,
      stepOffsets: {},
      parallelTime: {}
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
    },
    selectedRecipe: function(){
      return this.$store.state.selectedRecipe;
    },
    progress: function(){
      return this.$store.state.progress;
    },
    servingTimePrint: function(){
      return this.$store.state.servingTimePrint;
    },
    currentlyTiming: function(){
      return this.progress.timer.step === this.progress.currentStep;
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
      var that = this;
      var recipeTime = 0;
      that.parallelTime = {};
      that.stepOffsets = {};

      var included = !update;

      var timeAdded = that.progress.timer.step !== null ? that.progress.timer.timeAdded : 0;

      if(!currentRecipe) return;
      for(var i=0; i<currentRecipe.steps.length; i++){
        var currentStep = currentRecipe.steps[i];
        var previousStep = currentRecipe.steps[i-1];

        if(update) included = update && that.progress.currentStep <= i;

        that.parallelTime[i] = 0;
        that.stepOffsets[i] = 0;

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

        if(i === that.progress.timer.step) that.parallelTime[i] += timeAdded ? timeAdded : 0; // add parallel time for use

        if(currentStep.parallel){
          // current step has parallel component

          that.parallelTime[i] += parseInt(currentStep.duration); // add parallel time for use

          if(previousStep && previousStep.parallel){
            // previous step has parallel time
            if(currentStep.dependsOn !== null) that.parallelTime[currentStep.dependsOn] = 0; // remove parallel time of dependent step
            if(included) addTime(i, that.useParallelTime(currentStep.setupDuration, i) + currentStep.duration);
          }else{
            // previous step doesn't have parallel time
            if(included) addTime(i, currentStep.setupDuration + currentStep.duration);
          }
        }else{
          // current step doesn't have parallel component
          if(currentStep.dependsOn !== null) that.parallelTime[currentStep.dependsOn] = 0; // remove parallel time of dependent step
          if(included) addTime(i, that.useParallelTime(currentStep.duration, i));
        }

        if(that.progress.timer.step !== null && i < that.progress.timer.step) that.stepOffsets[that.progress.timer.step] += timeAdded;
      }

      function addTime(stepIndex, time){
        recipeTime += time;
        console.log(stepIndex+1, {recipeTime, time});
        that.stepOffsets[stepIndex] += recipeTime - time;
        if(stepIndex > that.progress.currentStep) that.stepOffsets[stepIndex] += that.currentStepDelay;
        if(timeAdded && stepIndex > that.progress.timer.step) that.stepOffsets[stepIndex] += timeAdded ? timeAdded : 0;
      }

      //console.log('parallelTime', this.parallelTime);

      recipeTime += timeAdded ? timeAdded : 0;
      //recipeTime += that.currentStepDelay;

      if(mode == 'time'){
        that.servingTime = moment().add(recipeTime, 'minutes').format('h:mm A');
        this.$store.commit('setServingTimePrint', this.servingTime);
      }else{
        that.servingTime = recipeTime;
      }

      if(mode == 'duration') that.recipeDuration = recipeTime;
    },
    calcTimeLeft: function(timer){
      var duration = timer.duration + parseInt(timer.timeAdded);
      var finishTime = moment(timer.started).add(duration, 'm');
      var secondsLeft = -moment().diff(finishTime, 'seconds');
      return secondsLeft;
    },
    checkForDelay: function(){
      if(this.selectedRecipe){
        var currentStep = this.selectedRecipe.steps[this.progress.currentStep];
        var currentStepHistory = this.progress.stepHistory[this.progress.currentStep];
        var stepStartTime = currentStepHistory[currentStepHistory.length-1];
        var lapsedTime = moment().diff(stepStartTime, 'seconds')/60;
        if(lapsedTime > 1) lapsedTime = parseInt(lapsedTime)+1;
        else lapsedTime = parseInt(lapsedTime);
        var timeLeft = currentStep.duration - lapsedTime;
        var currentStepDelay = timeLeft < 0 ? -timeLeft : 0;
        this.$store.commit('setCurrentStepDelay', currentStepDelay);
      }
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
      var that = this;
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

          //parallelTime[parallelStep] -= parallelTimeUsed;
          parallelTime[parallelStep] = 0;
          that.stepOffsets[currentStep] = -parallelTime[parallelStep];
        }
      });

      this.stepOffsets[currentStep] -= parallelTimeUsed;

      return duration - parallelTimeUsed; // duration to add to recipe time is what is left after parallel time used
    },
    getProgress: function(){
      var progress = localStorage.getItem('progress');
      if(progress){
        this.$store.commit('setProgress', JSON.parse(progress));
        this.$store.dispatch('loadSelectedRecipe', this.progress.id);
      }
    },
    clone: function(original){
      var copy = JSON.stringify(original);
      return JSON.parse(copy);
    }
  },
  created: function(){
    var that = this;
    window.addEventListener('keydown', this.handleKeyPress);
    this.getProgress();
    setInterval(function(){
      that.checkForDelay();
    }, 100);
  }
};
