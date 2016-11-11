"use strict";

const NO_MODULES = '!**/node_modules/**';
var gulp = require('gulp');
var xmlValidator = require('gulp-xml-validator');
var eslint = require('gulp-eslint');
var NamingfaceValidator = require('./verifiers/namingValidator');

gulp.task('xml-lint', function () {
  return gulp.src(['**/*.xml', NO_MODULES])
    .pipe(xmlValidator())
});

gulp.task('js-lint', () => {
    return gulp.src(['**/*.js', NO_MODULES])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('json-lint', () => {
    return gulp.src(['**/*.json', NO_MODULES])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('validate-naming', function () {
  return gulp.src(['**/js/package.json', NO_MODULES])
    .pipe(NamingfaceValidator())
});

gulp.task('ci-checks', ['js-lint', 'json-lint', 'xml-lint', 'validate-naming']);
