'use strict';

var Mocha = require('mocha'),
    Suite = require('mocha/lib/suite'),
    Test  = require('mocha/lib/test');

Mocha.interfaces['mocha-cakes-2'] = module.exports = mochaCakes;

function mochaCakes(suite) {
  var suites = [suite];

  suite.on('pre-require', function (context, file, mocha) {
    var common = require('mocha/lib/interfaces/common')(suites, context, mocha);

    context.run = mocha.options.delay && common.runWithSuite(suite);

    var wrapperCreator = createWrapper(file, suites, context, mocha);
    var testTypeCreator = createTestType(file, suites, mocha);

    context.after = common.after;
    context.afterEach = common.afterEach;
    context.before = common.before;
    context.beforeEach = common.beforeEach;

    context.Scenario = wrapperCreator('Scenario');
    context.Feature = wrapperCreator('Feature');
    context.describe = wrapperCreator('');

    context.Given = testTypeCreator('Given');
    context.When = testTypeCreator('When');
    context.Then = testTypeCreator('Then');
    context.And = testTypeCreator('And');
    context.But = testTypeCreator('But');
    context.it = testTypeCreator('');

    // lower-case aliases
    context.scenario = context.Scenario;
    context.feature = context.Feature;
    context.given = context.Given;
    context.when = context.When;
    context.then = context.Then;
    context.and = context.And;
    context.but = context.But;
  });
}

/**
 *  Helper functions
 **/

function createTestType(file, suites, mocha) {
  return function testTypeCreator(type) {
    function testType(title, fn) {
      var suite, test;
      var testName = type ? type + ' ' + title : title;

      suite = suites[0];
      if (suite.pending) fn = null;
      test = new Test(testName, fn);
      test.file = file;
      suite.addTest(test);

      return test;
    }

    testType.skip = function skip(title) {
      testType(title);
    };

    testType.only = function only(title, fn) {
      var test = testType(title, fn);
      mocha.grep(test.fullTitle());
    };

    return testType;
  };
}

function createWrapper(file, suites, context, mocha) {
  return function wrapperCreator(type) {
    function createLabel(title) {
      if (!type) return title;

      return  type + ': ' + title;
    }

    function wrapper(title, fn) {
      var suite = Suite.create(suites[0], createLabel(title));

      suite.file = file;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();

      return suite;
    }

    wrapper.skip = function skip(title, fn) {
      var suite = Suite.create(suites[0], createLabel(title));

      suite.pending = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
    };

    wrapper.only = function only(title, fn) {
      var suite = wrapper(title, fn);
      mocha.grep(suite.fullTitle());
    };

    return wrapper;
  };
}
