import Gulp from 'gulp'
import Babel from 'gulp-babel'

Gulp.task('js', () => {
	return Gulp.src('converter.js')
		.pipe(Babel())
		.pipe(Gulp.dest('bin'))
});

Gulp.task('watch', () => {
	gulp.watch('converter.js', ['js'])
});

Gulp.task('default', ['js'])