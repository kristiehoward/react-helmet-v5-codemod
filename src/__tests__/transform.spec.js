const defineTest = require('../../test/testUtils').defineTest;

defineTest(__dirname, 'transform', null, 'HelmetReadme', null);
defineTest(__dirname, 'transform', null, 'SelfClosing', null);
defineTest(__dirname, 'transform', null, 'VariableAndFunction', null);
defineTest(__dirname, 'transform', null, 'SpreadProps', 'Cannot process JSX spread attributes');
defineTest(__dirname, 'transform', null, 'InvalidProps', null);
