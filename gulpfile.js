const gulp = require('gulp');
const concat = require('gulp-concat');
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify');
const zip = require('gulp-zip');
const del = require('del');

// Deletes all output directories and files
gulp.task('clean', function() {
    return del(['build/', 'publish/', 'repo/']);
});

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

// Builds the Crate game client and
// publishes its uglified version to the build directory
gulp.task('game-client', function() {
    return gulp.src(['repo/engine-client.ts',
        'src/game/client/**/*.ts',
        'src/game/Main.ts'])
        .pipe(ts({
            target: 'ES5',
            noImplicitAny: false,
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
        'src/game/client/**/*.ts',
        'src/game/Main.ts'])
        .pipe(ts({
            target: 'ES5',
            noImplicitAny: false,
            out: 'game.js'
        }))
        .pipe(gulp.dest('build/sources/'));
});

// Builds the Crate game server and
// publishes its uglified version to the build directory
gulp.task('game-server', function() {
    return gulp.src(['repo/engine-server.js', 'src/game/server/**/*.js'])
        .pipe(concat('server.js'))
        .pipe(uglify())
        .on('error', function(e) {
            console.log(e);
         })
        .pipe(gulp.dest('build/sources/'));
});

// Builds the Crate game server in debug mode and
// publishes it to the build directory
gulp.task('game-server-debug', function() {
    return gulp.src(['repo/engine-server.js', 'src/game/server/**/*.js'])
        .pipe(concat('server.js'))
        .pipe(gulp.dest('build/sources/'));
});

// Packages the index files
gulp.task('index', function() {
    return gulp.src('src/index.html')
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
        .pipe(gulp.dest('build/meta/'));
});

// Packages levels
gulp.task('levels', function() {
    return gulp.src('levels/**/*.json')
        .pipe(gulp.dest('build/levels/'));
});

// Runs all tasks and packages the game
gulp.task('install',
    [
        'engine-client',
        'engine-server',
        'game-client',
        'game-server',
        'resources-images',
        'resources-sounds',
        'meta',
        'levels',
        'index'
    ], function() {
    return gulp.src([
        'build/sources/',
        'build/resources/images/',
        'build/resources/sounds/',
        'build/meta/'
    ], {base: '.'})
    .pipe(zip('crate.zip'))
    .pipe(gulp.dest('publish/'));
});

// Runs all tasks in debug mode where aplicable and packages the game
gulp.task('install-debug',
    [
        'engine-client',
        'engine-server',
        'game-client-debug',
        'game-server-debug',
        'resources-images',
        'resources-sounds',
        'meta',
        'levels',
        'index'
    ], function() {
    return gulp.src([
        'build/sources/',
        'build/resources/images/',
        'build/resources/sounds/',
        'build/meta/'
    ], {base: '.'})
    .pipe(zip('crate.zip'))
    .pipe(gulp.dest('publish/'));
});