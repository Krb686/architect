//IMPORTS
var Parser = require('./Parser.js');

var parser1 = new Parser();
parser1.parse("Parser.js");
//parser1.parse("jquery-2.1.1.js");
//parser1.parse("ext-all-rtl-debug2.js");
parser1.dumpFunctions();
parser1.dumpStrings();
parser1.dumpComments();
parser1.dumpRegularExpressions();
parser1.dumpObjectLiterals();
