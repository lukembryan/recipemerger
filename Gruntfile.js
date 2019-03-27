module.exports = function(grunt) {

  grunt.initConfig({
  	pkg: grunt.file.readJSON('package.json'),
    watch: {
      css: {
  	    files: 'src/assets/css/less/styles.less',
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
  	      'src/assets/css/styles.css': 'src/assets/css/less/styles.less'
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
  	      'src/assets/css/styles.min.css': ['src/assets/css/styles.css']
  	    }
  	  }
  	}
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['less', 'cssmin']);

};
