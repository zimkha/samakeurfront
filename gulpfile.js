var gulp = require('gulp') ,
    sass = require('gulp-sass'),
    browserSync = require('browser-sync').create();


var sass = require('gulp-sass');

gulp.task('sass', function() {
    return gulp.src("assets/css/sass/*")
        .pipe(sass())
        .pipe(gulp.dest("assets/css/"))

});

gulp.task('watch', function(){
    browserSync.init({
        watch: true,
        server: { baseDir: "./" }
    });
    gulp.watch('assets/css/sass/*.scss', gulp.series('sass'));
    gulp.watch(['.html', 'assets/js/*.js', 'assets/css/*.css']).on('change', browserSync.reload);
});

// permet de demarer le gulp par default
gulp.task('default', gulp.series('sass', 'watch'));


