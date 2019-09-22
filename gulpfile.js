const gulp = require("gulp"),
  watch = require("gulp-watch"),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  sassGlob = require('gulp-sass-glob'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  webpack = require('webpack'),
  webpackConfig = require('./webpack.config');

sass.compiler = require('node-sass');

gulp.task('html', function html() {
  return gulp.src('src/index.html')
    .pipe(gulp.dest('build'));
});

gulp.task('reload', async function reload() {
  browserSync.init({
    server: {
      baseDir: "build"
    }
  },function () {
    browserSync.reload();
  });
});

gulp.task('scripts', async function scripts() {
  webpack(webpackConfig,  function(err,stats){
    if (err) console.log('Webpack', err.toString());
  })
});

gulp.task('styles', function styles(){
    return gulp.src('src/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sassGlob())
      .pipe(sass.sync({outputStyle: 'expanded', includePaths: ['node_modules']}).on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(autoprefixer({ cascade: false }))
      .pipe(gulp.dest('build'))
      .pipe(browserSync.stream());
});

gulp.task('default', async function () {
  console.log('horray');
});

gulp.task('cssInject',  function cssInject() {
  return gulp.src('src/**/*.scss')
    .pipe(browserSync.stream())
});

gulp.task('watch', function () {
  browserSync.init({
    notify: false,
    server: {
      baseDir: 'build'
    }
  });

  watch(['src/index.html','src/script-es6.js'],
    gulp.series(
      gulp.parallel('html','scripts'),
      gulp.parallel('reload')
    )
  );
  watch(['src/style.scss'],
    gulp.series(
      gulp.parallel('styles')
    )
  );
});

