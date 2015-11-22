'use strict';

const gulp = require('gulp');
const less = require('gulp-less');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync');
const del = require('del');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cp = require('child_process');
const imagemin = require('gulp-imagemin');
const minifyCss = require('gulp-minify-css');

var plumberOpts = {errorHandler: notify.onError('Error: <%= error.message %>')};

gulp.task('clean', function () {
    del([
        './_site/**/*'
    ]);
});

gulp.task('javascript', function() {
    return gulp.src([
            './node_modules/jquery/dist/jquery.js',
            './node_modules/bootstrap/js/transition.js',
            './node_modules/bootstrap/js/collapse.js',
            './source/assets/js/*.js'
        ])
        .pipe(plumber(plumberOpts))
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(concat('app-merged.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./_site/assets/js'));
        //.pipe(browserSync.stream())
});

gulp.task("less", function () {
    return gulp.src('./source/assets/less/*.less')
        .pipe(plumber(plumberOpts))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['Firefox >= 35', 'Chrome >= 38', 'IE >= 9', 'last 2 versions']
        }))
        .pipe(minifyCss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./_site/assets/css'))
        .pipe(browserSync.stream({match: '**/*.css'}))
        .pipe(notify({message: 'LESS done!', onLast: true}));
});

gulp.task('images', function() {
    return gulp.src('./source/assets/images/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./_site/assets/images/'));
});

gulp.task('jekyll-build', function(done) {
    browserSync.notify('Building Jekyll');
    return cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit'})
        .on('close', done);
});

gulp.task('jekyll-rebuild', ['jekyll-build'], function() {
    browserSync.reload();
});

gulp.task('watch', ['clean'], function () {
    browserSync({
        server: {
            baseDir: "./_site/"
        }
    });

    gulp.start('less');
    gulp.start('javascript');
    gulp.start('images');
    gulp.start('jekyll-rebuild');

    watch('./source/assets/less/*.less', function () {
        gulp.start("less");
    });
    watch('./source/assets/js/*.js', function () {
        gulp.start("javascript");
    });
    watch('./source/assets/images/*', function () {
        gulp.start("images");
    });
    watch('./source/**/*.html', function() {
       gulp.start("jekyll-rebuild");
    });
});

gulp.task('default', ['clean', 'less', 'javascript', 'images', 'jekyll-build']);
