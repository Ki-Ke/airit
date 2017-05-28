const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');

const project = ts.createProject('tsconfig.json');
const paths = {
    pages: ['src/*.html']
};

// Gulp task for HTML
gulp.task('build:html', () => {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'));
});

gulp.task('watch:html', () => {
    gulp.watch(paths.pages, ['build:html']);
});

// Gulp task for ts
gulp.task('build:js', () => {
    return project.src()
        .pipe(project())
        .js.pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch:js', () => {
    gulp.watch([
        'main.ts',
        'src/**/*.ts',
        'src/**/*.jsx'
    ], ['build:js']);
});

// Gulp for node modules
gulp.task('build:vendor', function() {
    browserify({entries: ['./src/vendor.js']})
        .bundle()
        .pipe(source('vendor.min.js'))
        .pipe(buffer())
        .pipe(uglify({ mangle: false }))
        .pipe(gulp.dest('dist'));
});

// Gulp for scss
gulp.task('build:css', () => {
    return gulp.src('src/styles/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('watch:css', () => {
    gulp.watch('src/**/*.scss', ['build:css']);
});

gulp.task('build', ['build:html', 'build:js', 'build:css', 'build:vendor']);
gulp.task('watch', ['watch:html', 'watch:js', 'watch:css']);

gulp.task('default', ['build', 'watch']);