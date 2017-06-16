const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const sass = require('gulp-sass');
const gUtil = require('gulp-util');
const buffer = require('vinyl-buffer');
const babelify = require('babelify');
const eslint = require('gulp-eslint');
const run = require('gulp-run');
const del = require('del');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

const paths = {
    pages: ['src/*.html'],
    reactApp: ['src/app/app.jsx'],
    jsx: ['src/app/*.jsx', 'src/app/**/*.jsx'],
    preload: 'src/renderer/preloadScript.ts',
    scss: ['src/app/styles/*.scss', 'src/app/styles/**/*.scss'],
    vendor: ['./src/vendor.js']
};

del.sync('dist/**');

// Gulp task for HTML
gulp.task('build:html', () => {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'))
        .on('error', gulpError);
});

gulp.task('watch:html', () => {
    gulp.watch(paths.pages, ['build:html']);
});

// Gulp task for jsx
gulp.task('build:jsx', () => {
    browserify(paths.reactApp, {debug: true})
        .transform(babelify)
        .bundle()
        .pipe(source('_app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('src'));
});

// Gulp task for preload script
gulp.task('build:preload', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('src'));
});

gulp.task('lint', () => {
    gulp.src(paths.jsx)
        .pipe(eslint());
});

gulp.task('watch:js', () => {
    gulp.watch(paths.jsx, ['build:jsx']);
});

// Gulp for node modules
gulp.task('build:vendor', () => {
    browserify({entries: paths.vendor})
        .bundle()
        .pipe(source('_vendor.js'))
        .pipe(buffer())
        .pipe(gulp.dest('src'))
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

gulp.task('generate', ['build:html', 'build:jsx', 'build:preload', 'build:css', 'build:vendor', 'lint']);
gulp.task('watch', ['watch:html', 'watch:js', 'watch:css', 'lint']);

gulp.task('default', ['generate', 'watch'], () => {
    run('electron .').exec();
});

gulp.task('build', ['generate']);