const gulp = require('gulp'),
    concat = require('gulp-concat'),
    ts = require('gulp-typescript'),
    uglify = require('gulp-uglify'),
    jsonMinify = require('gulp-json-minify'),
    zip = require('gulp-zip'),
    del = require('del'),
    run = require('run-sequence');

/* ------ CLEANUP STEPS ------ */

// Deletes all output directories and files
gulp.task('clean', function() {
    return del(['build/', 'publish/', 'repo/']);
});

/* ------ EDITOR STEPS ------ */

// Builds the Crate editor client and
// publishes it to the repository
gulp.task('editor-client', function() {
    return gulp.src(['repo/engine-client.ts',
        'src/game/client/**/*.ts',
        'src/editor/client/**/*.ts'])
        .pipe(ts({
            target: 'ES5',
            noImplicitAny: false,
            out: 'editor.js'
        }))
        .pipe(gulp.dest('build/editor/'));
});

// Packages the editor index file
gulp.task('editor-index', function() {
    return gulp.src('src/editor/client/index.html')
        .pipe(gulp.dest('build/editor/'));
});

// Builds the Crate editor server and
// publishes it to the build directory
gulp.task('editor-server', function() {
    return gulp.src(['repo/engine-server.js', 'src/editor/server/**/*.js'])
        .pipe(concat('editor-server.js'))
        .pipe(gulp.dest('build/editor/'));
});

// Runs all tasks and packages the editor.
// Needs a packaged game to run
gulp.task('install-editor',
    [
        'editor-client',
        'editor-server',
        'editor-index'
    ], function() {
        return;
    });

/* ------ GAME AND ENGINE STEPS ------ */

// Builds the Crate engine client and
// publishes it to the repository
gulp.task('engine-client', function() {
    return gulp.src('src/engine/client/**/*.ts')
        .pipe(concat('engine-client.ts'))
        .pipe(gulp.dest('repo/'));
});

// Builds the Crate engine server and
// publishes its uglified version to the repository
gulp.task('engine-server', function() {
    return gulp.src('src/engine/server/**/*.js')
        .pipe(concat('engine-server.js'))
        .pipe(gulp.dest('repo/'));
});

// Builds the Crate game server and
// publishes its uglified version to the build directory
gulp.task('game-server', function() {
    return gulp.src(['repo/engine-server.js',
        'src/game/server/updatesProcessor.js',
        'src/game/server/server.js'])
        .pipe(concat('server.js'))
        .pipe(uglify())
        .on('error', function(e) {
            console.log(e);
         })
        .pipe(gulp.dest('build/sources/'));
});

// Builds the Crate game client and
// publishes its uglified version to the build directory
gulp.task('game-client', function() {
    return gulp.src(['repo/engine-client.ts',
        'src/game/client/util/**/*.ts',
        'src/game/client/world/**/*.ts',
        'src/game/client/objects/**/*.ts',
        'src/game/client/Main.ts'])
        .pipe(ts({
            target: 'ES5',
            noImplicitAny: false,
            removeComments: true,
            out: 'game.js'
        }))
        .pipe(uglify())
        .on('error', function(e) {
            console.log(e);
         })
        .pipe(gulp.dest('build/sources/'));
});

// Builds the Crate game client in debug mode and
// publishes it to the build directory
gulp.task('game-client-debug', function() {
    return gulp.src(['repo/engine-client.ts',
        'src/game/client/util/**/*.ts',
        'src/game/client/world/**/*.ts',
        'src/game/client/objects/**/*.ts',
        'src/game/client/Main.ts'])
        .pipe(ts({
            target: 'ES5',
            noImplicitAny: false,
            out: 'game.js'
        }))
        .pipe(gulp.dest('build/sources/'));
});

// Builds the Crate game server in debug mode and
// publishes it to the build directory
gulp.task('game-server-debug', function() {
    return gulp.src(['repo/engine-server.js',
        'src/game/server/updatesProcessor.js',
        'src/game/server/server.js'])
        .pipe(concat('server.js'))
        .pipe(gulp.dest('build/sources/'));
});

// Packages the index files
gulp.task('index', function() {
    return gulp.src('src/game/client/index.html')
        .pipe(gulp.dest('build/sources'));
});

// Packages image resources
gulp.task('resources-images', function() {
    return gulp.src('resources/images/**/*.*')
        .pipe(gulp.dest('build/resources/images/'));
});

// Packages sound resources
gulp.task('resources-sounds', function() {
    return gulp.src('resources/sounds/**/*.*')
        .pipe(gulp.dest('build/resources/sounds/'));
});

// Packages game and engine metadata
gulp.task('meta', function() {
    return gulp.src('meta/**/*.json')
        .pipe(jsonMinify())
        .pipe(gulp.dest('build/meta/'));
});

// Packages levels
gulp.task('levels', function() {
    return gulp.src('levels/**/*.json')
        .pipe(jsonMinify())
        .pipe(gulp.dest('build/levels/'));
});

gulp.task('package', function() {
    return gulp.src([
        'build/sources/**/*',
        'build/resources/images/**/*',
        'build/resources/sounds/**/*',
        'build/meta/**/*'
    ], {base: './build'})
    .pipe(zip('crate.zip'))
    .pipe(gulp.dest('publish/'));
});

// Runs all tasks and packages the game
gulp.task('install', function() {
        run('engine-client',
        'engine-server',
        'game-client',
        'game-server',
        'resources-images',
        'resources-sounds',
        'meta',
        'levels',
        'index',
        'package');
    });

// Runs all tasks in debug mode where aplicable and packages the game
gulp.task('install-debug', function() {
        run('engine-client',
        'engine-server',
        'game-client-debug',
        'game-server-debug',
        'resources-images',
        'resources-sounds',
        'meta',
        'levels',
        'index',
        'package');
    });