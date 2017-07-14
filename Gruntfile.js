module.exports = function(grunt) {

  grunt.initConfig({
  	pkg: grunt.file.readJSON('package.json'),
    watch: {
      css: {
  	    files: '**/*.less',
  	    tasks: ['less', 'cssmin'],
  	    options: {
  	      livereload: true
  	    }
  	  }
    },
    less: {
  	  production: {
  	    options: {
  	      paths: ['www/asset/css']
  	    },
  	    files: {
  	      'www/asset/css/template.css': 'www/asset/css/less/template.less'
  	    }
  	  }
  	},
  	cssmin: {
  	  options: {
  	    shorthandCompacting: false,
  	    roundingPrecision: -1
  	  },
  	  target: {
  	    files: {
  	      'www/asset/css/template.min.css': ['www/asset/css/template.css']
  	    }
  	  }
  	}
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['less', 'cssmin']);

};
