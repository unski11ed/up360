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
          'build/dev/css/style.css': 'src/less/jus-main.less',
          'build/dev/css/bootstrap.css': 'src/less/bootstrap-custom/custom-bootstrap.less',
          'build/dev/css/bootstrap-theme.css': 'src/less/bootstrap-custom/custom-theme.less',
          /*'build/dev/css/awesome-bootstrap-checkbox.css': 'bower_components/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.less',*/
        }
      },
      dist: {
        options: {
          paths: [
            "src/less",
            "vendor/bootstrap/less"
          ]
        },
        files: {//TODO: change
          '.tmp/css/style.css': 'src/less/jus-main.less',
          '.tmp/css/bootstrap.css': 'vendor/bootstrap-custom/less/bootstrap.less',
          '.tmp/css/bootstrap-theme.css': 'vendor/bootstrap-custom/less/theme.less',
          /*'.tmp/css/awesome-bootstrap-checkbox.css': 'bower_components/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.less',*/
        }
      }
    },

    bowercopy: {
      dev: {
        options: {
          destPrefix: 'build/dev'
        },
        files: {
          //js
          'js/jquery.js': 'jquery/dist/jquery.js',
          'js/d3.js': 'd3/d3.js',
          'js/jquery.dataTables.js': 'datatables/media/js/jquery.dataTables.js',
          'js/nv.d3.js': 'nvd3/build/nv.d3.js',
          'js/bootstrap.js': 'bootstrap/dist/js/bootstrap.js',
          'js/moment-with-locales.js': 'moment/min/moment-with-locales.js',
          'js/fullcalendar.js': 'fullcalendar/dist/fullcalendar.js',
          'js/summernote.js': 'summernote/dist/summernote.js',
          'js/bootstrap-editable.js': 'x-editable/dist/bootstrap3-editable/js/bootstrap-editable.js',
          'js/select2.js': 'select2/dist/js/select2.full.js',
          'js/jquery.bootstrap-touchspin.js': 'bootstrap-touchspin/dist/jquery.bootstrap-touchspin.js',
          'js/metisMenu.js': 'metisMenu/dist/metisMenu.js',

          //css
          'css/font-awesome.css': 'components-font-awesome/css/font-awesome.css',
          'css/jquery.dataTables.css': 'datatables/media/css/jquery.datatables.css',
          'css/fullcalendar.css': 'fullcalendar/dist/fullcalendar.css',
          'css/summernote.css': 'summernote/dist/summernote.css',
          'css/bootstrap-editable.css': 'x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css',
          'css/select2.css': 'select2/dist/css/select2.css',
          'css/jquery.bootstrap-touchspin.css': 'bootstrap-touchspin/dist/jquery.bootstrap-touchspin.css',
          'css/awesome-bootstrap-checkbox.css': 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css',
          'css/metisMenu.css': 'metisMenu/dist/metisMenu.css',

          //images
          'img/datatables': 'datatables/media/images',
          'img/editable': 'x-editable/dist/bootstrap3-editable/img',

          //fonts
          'fonts/font-awesome': 'components-font-awesome/fonts',
          'fonts/bootstrap': 'bootstrap/dist/fonts'
        }

      },

      dist: {
        files: {
          //js
          '.tmp/js/jquery.js': 'jquery/dist/jquery.js',
          '.tmp/js/d3.js': 'd3/d3.js',
          '.tmp/js/jquery.dataTables.js': 'datatables/media/js/jquery.dataTables.js',
          '.tmp/js/nv.d3.js': 'nvd3/build/nv.d3.js',
          '.tmp/js/bootstrap.js': 'bootstrap/dist/js/bootstrap.js',
          '.tmp/js/moment-with-locales.js': 'moment/min/moment-with-locales.js',
          '.tmp/js/fullcalendar.js': 'fullcalendar/dist/fullcalendar.js',
          '.tmp/js/summernote.js': 'summernote/dist/summernote.js',
          '.tmp/js/bootstrap-editable.js': 'x-editable/dist/bootstrap3-editable/js/bootstrap-editable.js',
          '.tmp/js/select2.js': 'select2/dist/js/select2.full.js',
          '.tmp/js/jquery.bootstrap-touchspin.js': 'bootstrap-touchspin/dist/jquery.bootstrap-touchspin.js',
          //css
          '.tmp/css/font-awesome.css': 'components-font-awesome/css/font-awesome.css',
          '.tmp/css/jquery.dataTables.css': 'datatables/media/css/jquery.datatables.css',
          '.tmp/css/fullcalendar.css': 'fullcalendar/dist/fullcalendar.css',
          '.tmp/css/summernote.css': 'summernote/dist/summernote.css',
          '.tmp/css/bootstrap-editable.css': 'x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css',
          '.tmp/css/select2.js': 'select2/dist/css/select2.css',
          '.tmp/css/jquery.bootstrap-touchspin.css': 'bootstrap-touchspin/dist/jquery.bootstrap-touchspin.css',
          '.tmp/css/awesome-bootstrap-checkbox.css': 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css',

          //images
          'build/dist/img/datatables': 'datatables/media/images',
          'build/dist/img/editable': 'x-editable/dist/bootstrap3-editable/img',

          //fonts
          'build/dist/fonts/font-awesome': 'components-font-awesome/fonts',
          'build/dist/fonts/bootstrap': 'bootstrap/dist/fonts'
        }
      }
    },
    replace: createRewriteConfig([
      //dev rewrite
      {id: 'bootstrap', file: 'build/dev/css/bootstrap.css'},
      {id: 'datatables', file: 'build/dev/css/jquery.dataTables.css'},
      {id: 'font-awesome', file: 'build/dev/css/font-awesome.css'},
      {id: 'editable', file: 'build/dev/css/bootstrap-editable.css'},
      //dist rewrite
      {id: 'bootstrap', file: '.tmp/css/bootstrap.css'},
      {id: 'datatables', file: '.tmp/css/jquery.dataTables.css'},
      {id: 'font-awesome', file: '.tmp/css/font-awesome.css'},
      {id: 'editable', file: '.tmp/css/bootstrap-editable.css'},
    ]),

    copy: {
      dev: {
        files: [
          {cwd: 'src/img', src: ['**/*'], dest: 'build/dev/img/', flatten: true, expand: true},
          {cwd: 'src/js', src: ['**/*.js'], dest: 'build/dev/js/', flatten: true, expand: true},
          {cwd: 'src', src: ['*.html'], dest: 'build/dev/', flatten: true, expand: true},
        ]
      },
      dist: {
        files: [
          {cwd: 'src/img', src: ['**/*'], dest: 'build/dist/img/', flatten: true, expand: true},
          {cwd: 'src/js', src: ['**/*.js'], dest: '.tmp/js/', flatten: true, expand: true},
          {cwd: 'src', src: ['*.html'], dest: 'build/dist/', flatten: true, expand: true},
        ]
      }
    },

    env : {
      dev: {
        NODE_ENV : 'DEVELOPMENT'
      },
      dist : {
        NODE_ENV : 'PRODUCTION'
      }
    },

    preprocess: {
      dev: {
        files: [
          {
            expand: true,
            cwd: 'src',
            src: [
              '*.html'
            ],
            dest: 'build/dev/',
            
          },
        ],
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: 'src',
            src: [
              '*.html'
            ],
            dest: 'build/dist/',
          },
        ],
      }
    },

    uglify: {
      dist: {
        files: {
          'build/dist/js/site.min.js': ['.tmp/js/*.js'],
          'build/dist/css/site.min.css': ['.tmp/css/*.css'],
        }
      }
    },

    watch: {
      less: {
        files: ['src/less/**/*.less', 'vendor/bootstrap-custom/less/**/*.less'],
        tasks: ['less:dev', 'replace'],
        options: {
          spawn: false,
          livereload: true,
        },
      },

      statics: {
        files: ['src/img/**/*', 'src/js/**/*.js', 'src/*.html', 'src/html-include/**/*.html'],
        tasks: ['default'],
        options: {
          spawn: false,
          livereload: true,
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9000,
          base: 'build/dev',
          livereload: true,
          open: true,
          hostname: 'localhost'
        }
      }
    },

    clean: {
      dev: ['build/dev'],
      tmp: ['.tmp']
    },
    
    'ftp-deploy': {
      dev: {
        auth: {
          host: 'praca.civ.pl',
          port: 21,
          authKey: 'test-dev'
        },
        src: 'build/dev',
        dest: '/',
        exclusions: ['build/dev/**/Thumbs.db']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-bowercopy');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ftp-deploy');

  // Default development task.
  grunt.registerTask('default', ['clean:dev', 'env:dev', 'less:dev', 'bowercopy:dev', 'copy:dev', 'preprocess:dev', 'replace']);

  grunt.registerTask('dev', ['default', 'connect:server', 'watch']);
  
  grunt.registerTask('deploy-dev', ['default', 'ftp-deploy:dev']);
  // Production task. (needs rework)
  //grunt.registerTask('dist', ['env:dist', 'less:dist', 'bowercopy:dist', 'copy:dist', 'replace', 'preprocess:dist', 'uglify:dist', 'clean:tmp']);

};
