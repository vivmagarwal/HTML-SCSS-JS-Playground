const gulp = require("gulp"),
  watch = require("gulp-watch"),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  sassGlob = require('gulp-sass-glob'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  { argv } = require('yargs');
  kc = require('kebab-case'),
  inject = require('gulp-inject'),
  plumber = require('gulp-plumber'),
  data = require('gulp-data'),
  twig = require('gulp-twig'),
  path = require('path'),
  fs = require('fs');

sass.compiler = require('node-sass');

var page;
var withstyle;
var clonefrom;
var cloneto;

if (argv.page) {
  if (kc(argv.page).charAt(0) === '-') {
    page = kc(argv.page).slice(1);
  } else {
    page = kc(argv.page);
  }
}

if (argv.withstyle) {
  withstyle = true;
}

if (argv.from && argv.from !== true) {
  clonefrom = argv.from;
}

if (argv.to) {
  if (kc(argv.to).charAt(0) === '-') {
    cloneto = kc(argv.to).slice(1);
  } else {
    cloneto = kc(argv.to);
  }
} else {
  if (clonefrom) {
    cloneto = file_newname(path.join(__dirname, 'pages'), `${clonefrom}-clone`)
  }
}

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

gulp.task('styles:pages', function styles(){
  return gulp.src(['./pages/**/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass.sync({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./pages'))
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

  watch(['./pages/**/index.html', './pages/**/*.js'],
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['./*.scss'],
    gulp.series(
      gulp.parallel('styles')
    )
  );

  watch(['./pages/**/*.scss'],
  gulp.series(
    gulp.parallel('styles:pages')
  )
);
});

// using templates to generate scaffold.
gulp.task('twig:html', function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  return gulp.src('./_templates/index.twig')
  // Stay live and reload on error
  .pipe(plumber({
     handleError: function (err) {
        console.log(err);
        this.emit('end');
     }
  }))
  .pipe(data({ title: page, withstyle: withstyle }))
    .pipe(twig({
      extname: '.html'
  }))
  .on('error', function (err) {
     process.stderr.write(err.message + '\n');
     this.emit('end');
  })
    .pipe(gulp.dest(path.join(__dirname, 'pages', page)));
});

gulp.task('twig:scss', function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  return gulp.src('./_templates/style.twig')
  // Stay live and reload on error
  .pipe(plumber({
     handleError: function (err) {
        console.log(err);
        this.emit('end');
     }
  }))
  .pipe(data({ title: page, withstyle: withstyle }))
    .pipe(twig({
      extname: '.scss'
  }))
  .on('error', function (err) {
     process.stderr.write(err.message + '\n');
     this.emit('end');
  })
    .pipe(gulp.dest(path.join(__dirname, 'pages', page)));
});

gulp.task('twig:script', function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  return gulp.src('./_templates/script.twig')
  // Stay live and reload on error
  .pipe(plumber({
     handleError: function (err) {
        console.log(err);
        this.emit('end');
     }
  }))
  .pipe(data({ title: page, withstyle: withstyle }))
    .pipe(twig({
      extname: '.js'
  }))
  .on('error', function (err) {
     process.stderr.write(err.message + '\n');
     this.emit('end');
  })
    .pipe(gulp.dest(path.join(__dirname, 'pages', page)));
});

gulp.task('linksInject', async function (done) {
  gulp.src('./index.html')
  .pipe(inject(
    gulp.src(['./pages/**/*.html'], {read: false}), {
      transform: function (filepath) {
        if (filepath.slice(-5) === '.html') {
          return '<li><a href="' + filepath + '">' + filepath + '</a></li>';
        }
        // Use the default transform as fallback:
        return inject.transform.apply(inject.transform, arguments);
      }
    }
  ))
    .pipe(gulp.dest('./'));
  done();
});

gulp.task('generate', gulp.series(gulp.parallel('twig:html', 'twig:scss', 'twig:script'), 'linksInject'));

gulp.task('clone-page', function () {
  if (!clonefrom) {
    throw new Error('Incorrect clone from!');
  }
  
  return gulp
  .src(path.join(__dirname, 'pages', clonefrom, '*'))
  .pipe(gulp.dest(path.join(__dirname, 'pages', cloneto)))
});

gulp.task('clone', gulp.series(gulp.parallel('clone-page'), 'linksInject'));

// helper functions

// todo : make sure it is the last dot.
function file_newname(path, filename) {
  let name, ext;

  if (filename.indexOf('.') !==  -1) {
    let pos = filename.indexOf('.')
    name = filename.substring(0, pos);
    ext = filename.substring(pos)
  } else {
    name = filename;
  }

  let newpath = `${path}/${filename}`;
  let newname = filename;

  let counter = 0;
  while (fs.existsSync(newpath)) {
    newname = ext ? `${name}-${counter}.${ext}` : `${name}-${counter}`;
    newpath = `${path}/${newname}`;
    counter++;
   }
  
  return newname;
}