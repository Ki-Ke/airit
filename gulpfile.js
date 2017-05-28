const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const gUtil = require('gulp-util');
const buffer = require('vinyl-buffer');
const react = require('gulp-react');
const run = require('gulp-run');

const project = ts.createProject('tsconfig.json');
const paths = {
    pages: ['src/*.html'],
    jsx: ['src/app/*.jsx', 'src/app/**/*.jsx'],
    scss: ['src/app/styles/*.scss', 'src/app/styles/**/*.scss'],
    allJs: ['src/*.ts', 'src/**/*.ts', 'src/app/*.jsx', 'src/app/**/*.jsx'],
    vendor: ['./src/vendor.js']
};

// Gulp task for HTML
gulp.task('build:html', () => {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'))
        .on('error', gulpError);
});

gulp.task('watch:html', () => {
    gulp.watch(paths.pages, ['build:html']);
});

// Gulp task for ts
gulp.task('build:js', () => {
    return project.src()
        .pipe(project())
        .js.pipe(gulp.dest('dist'))
        .on('error', gulpError);
});

// Gulp task for jsx
gulp.task('build:jsx', () => {
    gulp.src(paths.jsx)
        .pipe(react())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch:js', () => {
    gulp.watch(paths.allJs, ['build:js']);
});

// Gulp for node modules
gulp.task('build:vendor', () => {
    browserify({entries: paths.vendor})
        .bundle()
        .pipe(source('vendor.min.js'))
        .pipe(buffer())
        .pipe(uglify({ mangle: false }))
        .pipe(gulp.dest('dist'))
        .on('error', gulpError);
});

// Gulp for scss
gulp.task('build:css', () => {
    return gulp.src(paths.scss)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/styles'))
        .on('error', gulpError);
});

gulp.task('watch:css', () => {
    gulp.watch(paths.scss, ['build:css']);
});

function gulpError(error) {
    gUtil.log(error);
}

gulp.task('build', ['build:html', 'build:js', 'build:jsx', 'build:css', 'build:vendor']);
gulp.task('watch', ['watch:html', 'watch:js', 'watch:css']);

gulp.task('default', ['build', 'watch'], () => {
    run('electron src/main.js').exec();
});