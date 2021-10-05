'use strict';

const { src, dest, parallel, series, watch, lastRun } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const debug = require('gulp-debug');
const imageResize = require('gulp-image-resize');

const changed = require('gulp-changed');
const server = require('browser-sync').create();
const del = require('del');

const fs = require('fs');
const path = require('path');

function assetsImages() {
  return src('src/assets/images/**/*')
    .pipe(plumber())
    .pipe(
      changed('dist/assets/images', { hasChanged: changed.compareContents })
    )
    .pipe(dest('dist/assets/images'))
    .pipe(server.stream());
}

function assetsIcons() {
  return src('src/assets/icons/**/*')
    .pipe(plumber())
    .pipe(changed('dist/assets/icons', { hasChanged: changed.compareContents }))
    .pipe(dest('dist/assets/icons'))
    .pipe(server.stream());
}

function assetsFonts() {
  return src('src/assets/fonts/**/*')
    .pipe(plumber())
    .pipe(changed('dist/assets/fonts', { hasChanged: changed.compareContents }))
    .pipe(dest('dist/assets/fonts'))
    .pipe(server.stream());
}

function js() {
  return src('src/js/**/*', { since: lastRun(js) })
    .pipe(plumber())
    .pipe(dest('dist/js'))
    .pipe(server.stream());
}

function html() {
  return src('src/*.html', {
    since: lastRun(html),
  })
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

  watch('src/assets/images/**/*').on('all', function () {
    assetsImages();
    // server.reload();
  });

  watch('src/assets/icons/**/*').on('all', function () {
    assetsIcons();
    // server.reload();
  });

  watch('src/assets/fonts/**/*').on('all', function () {
    assetsFonts();
    // server.reload();
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
exports.assetsImages = assetsImages;
exports.assetsFonts = assetsFonts;
exports.assetsIcons = assetsIcons;

exports.default = series(
  clean,
  parallel(html, styles, js, assetsImages, assetsFonts, assetsIcons),
  parallel(startServer, startWatch)
);
