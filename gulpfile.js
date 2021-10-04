'use strict';

const { src, dest, parallel, series, watch, lastRun } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const debug = require('gulp-debug');
const server = require('browser-sync').create();
const del = require('del');

const fs = require('fs');
const path = require('path');

function assets(cb, configAssets) {
  if (!configAssets) {
    configAssets = {
      glob: 'src/assets/**/*',
      options: { since: lastRun(assets) },
    };
  }

  return src(configAssets.glob, configAssets.options)
    .pipe(plumber())
    .pipe(dest('dist/assets'))
    .pipe(server.stream());
}

function js() {
  return src('src/js/**/*', { since: lastRun(js) })
    .pipe(debug())
    .pipe(plumber())
    .pipe(dest('dist/js'))
    .pipe(server.stream());
}

function html() {
  return src('src/*.html', {
    since: lastRun(html),
  })
    .pipe(debug())
    .pipe(plumber())
    .pipe(
      htmlmin({
        collapseWhitespace: false,
      })
    )
    .pipe(dest('dist'))
    .pipe(server.stream());
}

function styles() {
  return src('src/sass/main.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(
      cleanCSS({
        level: 2,
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist'))
    .pipe(server.stream());
}

function startWatch() {
  watch('src/*.html', html);
  watch('src/**/*.scss', styles);
  watch('src/js/**/*.js', js);

  watch('src/assets/**/*').on('all', function (eventType, relativePath) {
    if (eventType === 'add' || eventType === 'change') {
      let filePath = path.resolve(__dirname, relativePath);

      try {
        if (fs.existsSync(filePath)) {
          console.log(`File exist [${eventType}] =>`, relativePath);

          let configAssets = {
            glob: relativePath,
            options: { base: 'src/assets' },
          };

          return assets(null, configAssets);
        } else {
          console.log('File Not Found =>', filePath);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      console.log(`Event -> ${eventType} <- [Exit]`);
      console.log(`Path => ${filePath}`);
      return;
    }
  });
}

function startServer() {
  server.init({
    server: { baseDir: './dist' },
    notify: false,
    online: false,
    open: false,
    files: [
      // {
      //   match: 'dist/assets/**/*',
      //   fn() {
      //     this.reload();
      //   },
      // },
    ],
  });
}

function clean(cb) {
  del.sync('dist');
  cb();
}

exports.html = html;
exports.startWatch = startWatch;
exports.startServer = startServer;
exports.styles = styles;
exports.clean = clean;
exports.assets = assets;

exports.default = series(
  clean,
  parallel(html, styles, assets, js),
  parallel(startServer, startWatch)
);
