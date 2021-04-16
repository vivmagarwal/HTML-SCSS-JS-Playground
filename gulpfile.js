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
  hljs = require('highlight.js'),
  marked = require('marked'),
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

let allPages = [];
try {
  const pagesFolder = path.join(__dirname, 'pages');
  fs.readdirSync(pagesFolder).forEach(function (file) {
    allPages.push(file);
  });
} catch (e) {
  console.log(e.message);
}

gulp.task('reload', async function reload() {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  }, function () {
    browserSync.reload();
  });
});

gulp.task('styles', function styles() {
  return gulp.src('./*.scss', { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass.sync({ outputStyle: 'expanded', includePaths: ['node_modules'] }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./'))
    .pipe(browserSync.stream());
});

gulp.task('styles:pages', function styles() {
  return gulp.src(['./pages/**/*.scss'], { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass.sync({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./pages'))
    .pipe(browserSync.stream());
});

gulp.task('cssInject', function cssInject() {
  return gulp.src('./*.scss', { allowEmpty: true })
    .pipe(browserSync.stream())
});

gulp.task('watch', function () {
  browserSync.init({
    notify: false,
    server: {
      baseDir: './'
    }
  });

  watch(['index.html'], 
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['script.js'],
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['introduction.md'],
    gulp.series('readmeInject', 'reload'
    )
  );

  watch(['./pages/**/index.html'],
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['./pages/**/*.js'],
    gulp.series(
      gulp.parallel('reload')
    )
  );

  watch(['./pages/**/readme.md'],
    gulp.series(
      'readmeInject:pages',
      'reload'
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

  return gulp.src('./_templates/index.twig', { allowEmpty: true })
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

gulp.task('twig:css', async function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  try {
    await fs.writeFile(path.join(__dirname, 'pages', page, 'style.css'), '', (error) => {
      console.log(error);
    });  
  } catch (e) {
    console.log(e);
  }
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
  gulp.src('./index.html', { allowEmpty: true })
    .pipe(inject(
      gulp.src(['./pages/**/*.html'], { read: false, allowEmpty: true }), {
      transform: function (filepath) {
        if (filepath.slice(-5) === '.html') {
          let splittedString = filepath.split('/');
          if (splittedString.length > 1 && splittedString[2]) {
            let titledString = splittedString[2].replace(/-/g, ' ');
            titledString = titledString.charAt(0).toUpperCase() + titledString.slice(1)
            return '<li><a href="' + filepath.substring(1) + '">' + titledString + '</a></li>';
          } else {
            return '<li><a href="' + filepath.substring(1) + '">' + filepath + '</a></li>';
          }
        }
        // Use the default transform as fallback:
        return inject.transform.apply(inject.transform, arguments);
      }
    }
    ))
    .pipe(gulp.dest('./'));
  done();
});

gulp.task('twig:readme', function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  return gulp.src('./_templates/readme.twig')
    // Stay live and reload on error
    .pipe(plumber({
      handleError: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe(data({ title: page, withstyle: withstyle }))
    .pipe(twig({
      extname: '.md'
    }))
    .on('error', function (err) {
      process.stderr.write(err.message + '\n');
      this.emit('end');
    })
    .pipe(gulp.dest(path.join(__dirname, 'pages', page)));
});

gulp.task('twig:classdiagram', function () {
  if (!page) {
    throw new Error('Incorrect page name!');
  }

  return gulp.src('./_templates/classdiagram.twig', { allowEmpty: true })
    // Stay live and reload on error
    .pipe(plumber({
      handleError: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe(data({ title: page, withstyle: withstyle }))
    .pipe(twig({
      extname: '.duml'
    }))
    .on('error', function (err) {
      process.stderr.write(err.message + '\n');
      this.emit('end');
    })
    .pipe(gulp.dest(path.join(__dirname, 'pages', page)));
});

gulp.task('readmeInject', function (done) {
  gulp.src('./index.html', { allowEmpty: true })
    .pipe(inject(gulp.src(['./introduction.md'], { allowEmpty: true }), {
      starttag: '<!-- inject:readme:md -->',
      transform: function (filepath, file) {
        return marked(file.contents.toString(), {
          highlight: function (code, lang = 'js' ) {
            return hljs.highlight(lang || 'js', code).value;
          }
        });
      }
    }))
    .pipe(gulp.dest('./'));
  done();
});

gulp.task('readmeInject:pages', function (done) {

  try {
    allPages = [];
    const pagesFolder = path.join(__dirname, 'pages');
    fs.readdirSync(pagesFolder).forEach(function (file) {
      allPages.push(file);
    });
  } catch (e) {
    console.log(e.message);
  }

  if (allPages.length > 0) {
    allPages.forEach(function (_page) {
      gulp.src(`./pages/${_page}/index.html`, { allowEmpty: true })
        .pipe(inject(
          gulp.src([`./pages/${_page}/readme.md`], { allowEmpty: true }), {
          starttag: '<!-- inject:readme:md -->',
          transform: function (filepath, file) {
            return marked(file.contents.toString(), {
              highlight: function (code, lang="js") {
                return hljs.highlight(lang || 'js', code).value;
              }
            });
          },
          relative: false,
          ignorePath: './node_modules',
          addRootSlash: false,
        }
        ))
        .pipe(gulp.dest(`./pages/${_page}`));
    })
  }
  done();



});

// gulp.task('scriptInject', async function (done) {
//   gulp.src('./index.html')
//     .pipe(inject(gulp.src(['./script.js']), {
//       starttag: '<!-- inject:script:js -->',
//       transform: function (filepath, file) {
//         return (file.contents.toString('utf8').trim());
//       }
//     }))
//     .pipe(gulp.dest('./'));
//   done();
// });

// gulp.task('scriptInject:pages', async function (done) {
//   try {
//     allPages = [];
//     const pagesFolder = path.join(__dirname, 'pages');
//     fs.readdirSync(pagesFolder).forEach(function (file) {
//       allPages.push(file);
//     });
//   } catch (e) {
//     console.log(e.message);
//   }

//   if (allPages.length > 0) {
//     allPages.forEach(function (_page) {
//       gulp.src(`./pages/${_page}/index.html`)
//         .pipe(inject(
//           gulp.src([`./pages/${_page}/script.js`]), {
//           starttag: '<!-- inject:script:js -->',
//           transform: function (filepath, file) {
//             return (file.contents.toString('utf8').trim());
//           },
//           relative: false,
//           ignorePath: './node_modules',
//           addRootSlash: false,
//         }
//         ))
//         .pipe(gulp.dest(`./pages/${_page}`));
//     })
//   }
//   done();
// });

// gulp.task('stylesInject', async function (done) {
//   gulp.src('./index.html')
//     .pipe(inject(gulp.src(['./style.scss']), {
//       starttag: '<!-- inject:styles:scss -->',
//       transform: function (filepath, file) {
//         return (file.contents.toString('utf8').trim());
//       }
//     }))
//     .pipe(gulp.dest('./'));
//   done();
// });

// gulp.task('stylesInject:pages', async  function (done) {
//   try {
//     allPages = [];
//     const pagesFolder = path.join(__dirname, 'pages');
//     fs.readdirSync(pagesFolder).forEach(function (file) {
//       allPages.push(file);
//     });
//   } catch (e) {
//     console.log(e.message);
//   }

//   if (allPages.length > 0) {
//     allPages.forEach(function (_page) {
//       gulp.src(`./pages/${_page}/index.html`)
//         .pipe(inject(
//           gulp.src([`./pages/${_page}/style.scss`]), {
//           starttag: '<!-- inject:styles:scss -->',
//           transform: function (filepath, file) {
//             return (file.contents.toString('utf8').trim());
//           },
//           relative: false,
//           ignorePath: './node_modules',
//           addRootSlash: false,
//         }
//         ))
//         .pipe(gulp.dest(`./pages/${_page}`));
//     })
//   }
//   done();
// });

gulp.task('generate', gulp.series(gulp.parallel('twig:html', 'twig:scss', 'twig:script', 'twig:readme', 'twig:classdiagram'), 'twig:css', 'linksInject'));

gulp.task('clone-page', function () {
  if (!clonefrom) {
    throw new Error('Incorrect clone from!');
  }

  return gulp
    .src(path.join(__dirname, 'pages', clonefrom, '*'), { allowEmpty: true })
    .pipe(gulp.dest(path.join(__dirname, 'pages', cloneto)))
});

gulp.task('clone', gulp.series(gulp.parallel('clone-page'), 'linksInject'));

// helper functions

// todo : make sure it is the last dot.
function file_newname(path, filename) {
  let name, ext;

  if (filename.indexOf('.') !== -1) {
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