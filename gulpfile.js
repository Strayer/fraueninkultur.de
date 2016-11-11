'use strict';

const gulp = require('gulp');
const less = require('gulp-less');
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
const cleanCss = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');

var plumberOpts = {errorHandler: notify.onError('Error: <%= error.message %>')};

function clean() {
    return del(['./_site/**/*']);
}

function process_javascript() {
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
}

function process_less() {
    return gulp.src('./source/assets/less/*.less', {since: gulp.lastRun(process_less)})
        .pipe(plumber(plumberOpts))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer({
            browsers: ['Firefox >= 35', 'Chrome >= 38', 'IE >= 9', 'last 2 versions']
        }))
        .pipe(cleanCss())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./_site/assets/css'))
        .pipe(browserSync.stream({match: '**/*.css'}))
        .pipe(notify({message: 'LESS done!', onLast: true}));
}

function process_images() {
    return gulp.src('./source/assets/images/*', {since: gulp.lastRun(process_images)})
        .pipe(imagemin())
        .pipe(gulp.dest('./_site/assets/images/'));
}

function build_jekyll(callback) {
    const jekyll = cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit'});

    jekyll.on('exit', function (code) {
        callback(code === 0 ? null : new Error('ERROR: Jekyll process exited with code: ' + code));
    });
}

function process_html() {
    return gulp.src('./_build/jekyll/**/*.html', {since: gulp.lastRun(process_html)})
        .pipe(htmlmin({collapseWhitespace: true, minifyJS: true}))
        .pipe(gulp.dest('_site'))
        .pipe(browserSync.stream());
}

function build_tar() {
    const isoDate = new Date().toISOString().replace(':', '.');

    return gulp.src('./_site/**/*')
        .pipe(tar('dist-' + isoDate + '.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('./_dist/'));
}

gulp.task('default', gulp.series(
    clean,
    gulp.parallel(process_less, process_javascript, process_images, build_jekyll),
    process_html
));

gulp.task('watch', gulp.series('default', function () {
    browserSync({
        server: {
            baseDir: "./_site/"
        }
    });

    gulp.watch('./source/assets/less/*.less', process_less);
    gulp.watch('./source/assets/js/*.js', process_javascript);
    gulp.watch('./source/assets/images/*', process_images);
    gulp.watch('./source/**/*.html', gulp.series(build_jekyll, process_html));
}));

gulp.task('dist', gulp.series('default', build_tar));
