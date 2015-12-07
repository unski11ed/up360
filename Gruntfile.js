/*
Creating two tasks - development and production

TODO: -production build needs to be rethink and rewritten, keeping in mind it is a reusable template
      -refactorization needed asap
      -css url rewriting should be remade
*/

module.exports = function(grunt) {
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    less: {
      dev: {
        options: {
          paths: [
            "src/less",
            "bower_components/bootstrap/less",
            "bower_components/awesome-bootstrap-checkbox",
          ],
          dumpLineNumbers: 'all',
        },
        files: {
          'dist/up-360.css': 'src/less/main.less',
        }
      }
    },

    copy: {
      dev: {
        flatten: true, 
        src: [
          'node_modules/hammerjs/hammer.js',
          'node_modules/imagesloaded/imagesloaded.pkgd.js',
          'node_modules/screenfull/dist/screenfull.js',
          'node_modules/velocity-animate/velocity.js'
        ],
        dest: '.tmp/js/libs/'
      }
    },
    
    browserify: {
      'dist/up-360.js': ['src/**/*.js']
    },
    
    uglify: {
      dev: {
        'files': {
          'dist/up-360.js': ['.tmp/js/libs/*.js', 'src/js/*.js']
        },
        'options': {
          mangle: false,
          compress: false,
          beautify: true,
        }
      },
      dist: {
        files: {
          'dist/up-360.min.js': ['dist/up-360.js'],
          'dist/up-360.min.css': ['dist/up-360.css'],
        },
        options: {
          compress: true
        }
      }
    },

    watch: {
      less: {
        files: ['src/less/**/*.less'],
        tasks: ['less:dev'],
        options: {
          spawn: false,
          livereload: true,
        },
      },

      js: {
        files: ['src/js/**/*.js'],
        tasks: ['browserify'],
        options: {
          spawn: false,
          livereload: true,
        }
      },
      
      examples: {
        files: ['example/**/*.js', 'example/**/*.html', 'example/**/*.css'],
        tasks: [],
        options: {
          spawn: false,
          livereload: true
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9000,
          base: ['example', 'dist', 'node_modules'],
          livereload: true,
          open: true,
          hostname: 'localhost'
        }
      }
    },

    clean: {
      tmp: ['.tmp']
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('dev', ['less:dev', 'browserify']);
  
  grunt.registerTask('dist', ['dev', 'uglify:dist', 'clean:tmp']);
  
  
  // Default development task.
  grunt.registerTask('default', ['dev', 'connect:server', 'watch']);
};
