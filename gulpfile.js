'use strict';

// Dependencies
const gulp                          = require('gulp');
const del                           = require('del');
const gulppif                       = require('gulp-if');
const util                          = require('gulp-util');
const sourcemaps                    = require('gulp-sourcemaps');
const plumber                       = require('gulp-plumber');
const gulpSass                      = require('gulp-sass')(require('sass'));
const tildeImporter                 = require('node-sass-tilde-importer');
const autoprefixer                  = require('autoprefixer');
const cssnano                       = require('gulp-cssnano');
const babel                         = require('gulp-babel');
const webpack                       = require('webpack-stream');
const uglify                        = require('gulp-uglify');
const concat                        = require('gulp-concat');
const browserSync                   = require('browser-sync').create();


// Folders
const folderHtmlMain                = './html/';
const folderAssetsMain              = './assets/';
const folderSrcMain                 = folderAssetsMain + 'src/';
const folderDistMain                = folderAssetsMain + 'dist/';
const folderSrcNodeModules          = './node_modules/';
const folderDistNodeModules         = folderAssetsMain + 'vendor/';
const nodeDependencies              = Object.keys(require('./package.json').dependencies || {});


// Environment
const configProduction              = {production: !!util.env.production, sourceMaps: !util.env.production};


// Compile SCSS Files
gulp.task('sass-custom', () => {
    return gulp.src([
        //folderSrcMain + 'scss/bootstrap/**/*.*',
        //folderSrcMain + 'scss/plugin/**/*.*',
        //folderSrcMain + 'scss/custom/**/*.*',
        folderSrcMain + 'scss/**/*.*'
    ])
        .pipe(gulppif(configProduction.sourceMaps, sourcemaps.init()))
        .pipe(plumber())
        .pipe(gulpSass({
            importer: tildeImporter
        }))
        .pipe(configProduction.production ? cssnano({
            reduceIdents: false,
            discardComments: {
                removeAll: true
            },
            discardUnused: false,
            zindex: false,
        }) : util.noop())
        .pipe(concat('custom-app.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(folderDistMain + 'css'))
        .pipe(browserSync.stream());
});


// Compile JS Files
gulp.task('script-custom', () => {
    return gulp.src([
        //folderSrcMain + 'script/plugin/**/app.js',
        //folderSrcMain + 'script/custom/**/app.js',
        folderSrcMain + 'script/**/app.js'
    ])
        .pipe(plumber())
        .pipe(webpack({
            mode: 'production'
        }))
        .pipe(gulppif(configProduction.sourceMaps, sourcemaps.init()))
        .pipe(babel({
            presets: [ '@babel/env' ]
        }))
        .pipe(concat('custom-app.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(folderDistMain + 'js'))
        .pipe(browserSync.stream());
});


// Module Packages
gulp.task('vendor', () => {
    if (nodeDependencies.length === 0) {
        return new Promise((resolve) => {
            console.log("No dependencies specified");
            resolve();
        });
    }

    return gulp.src(nodeDependencies.map(dependency => folderSrcNodeModules + dependency + '/**/*.*'), { base: folderSrcNodeModules })
        .pipe(gulp.dest(folderDistNodeModules))
        .pipe(browserSync.stream());
});


// Server
gulp.task('serve', () => {
    return browserSync.init({
        server: {
            baseDir: [ './' ],
            index: "Home_Page.html",
            https: false,
            port: 3000
        },
        //open: "local",
        callbacks: {
            /**
             * This 'ready' callback can be used
             * to access the Browsersync instance
             */
            ready: function(err, bs) {

                // example of accessing URLS
                console.log(bs.options.get('urls'));

                // example of adding a middleware at the end
                // of the stack after Browsersync is running
                bs.addMiddleware("*", function (req, res) {
                    res.writeHead(302, {
                        location: "404.html"
                    });
                    res.end("Redirecting!");
                });
            }
        }
    });
});


// Watch Files
gulp.task('watch', () => {

    const watch = [
        //folderHtmlMain + '**/*.html',
        folderSrcMain + 'sass/**/*.*',
        folderSrcMain + 'script/**/*.*'
    ];

    gulp.watch(watch, gulp.series('devel')).on('change', browserSync.reload);
    gulp.watch(watchVendor, gulp.series('vendor')).on('change', browserSync.reload);
});


// Run Task
gulp.task('clear', () => del([ folderDistMain, folderDistNodeModules ]));
gulp.task('custom', gulp.series('sass-custom', 'script-custom'));
gulp.task('build', gulp.series('clear', 'vendor', 'custom'));
gulp.task('devel', gulp.series('custom', gulp.parallel('watch')));
gulp.task('start', gulp.series('build', 'vendor', 'devel', gulp.parallel('serve', 'watch')));
gulp.task('default', gulp.series('build', 'vendor', 'devel'));