const gulp = require("gulp"),
  watch = require("gulp-watch"),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  sassGlob = require('gulp-sass-glob'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create();

sass.compiler = require('node-sass');

gulp.task('reload', async function reload() {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  },function () {
    browserSync.reload();
  });
});

gulp.task('styles', function styles(){
    return gulp.src('./*.scss')
      .pipe(sourcemaps.init())
      .pipe(sassGlob())
      .pipe(sass.sync({outputStyle: 'expanded', includePaths: ['node_modules']}).on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(autoprefixer({ cascade: false }))
      .pipe(gulp.dest('./'))
      .pipe(browserSync.stream());
});

gulp.task('cssInject',  function cssInject() {
  return gulp.src('./*.scss')
    .pipe(browserSync.stream())
});

gulp.task('watch', function () {
  browserSync.init({
    notify: false,
    server: {
      baseDir: './'
    }
  });

  watch(['index.html','script.js'],
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['./*.scss'],
    gulp.series(
      gulp.parallel('styles')
    )
  );
});

