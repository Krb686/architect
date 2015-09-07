//IMPORTS
var fs = require('fs');
var winston = require('winston');


// ======================================================================
// =================== Create loggers ===================================
var stringLogger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({
			name: 'log-strings',
			filename: './logs/strings.log',
			level: 'strings',
			json: false
		})
	],
	levels: {
		strings: 1
	}
});


var commentLogger = new (winston.Logger)({
        transports: [
                new (winston.transports.File)({
                        name: 'log-comments',
                        filename: './logs/comments.log',
                        level: 'comments',
			json: false
                })
        ],
        levels: {
                comments: 1
        }
});

var regularExpressionLogger = new (winston.Logger)({
        transports: [
                new (winston.transports.File)({
                        name: 'log-regexps',
                        filename: './logs/regexps.log',
                        level: 'regexps',
			json: false
                })
        ],
        levels: {
                regexps: 1
        }
});

var functionLogger = new (winston.Logger)({
        transports: [
                new (winston.transports.File)({
                        name: 'log-functions',
                        filename: './logs/functions.log',
                        level: 'functions',
			json: false
                })
        ],
        levels: {
                functions: 1
        }
});

var literalLogger = new (winston.Logger)({
        transports: [
                new (winston.transports.File)({
                        name: 'log-literals',
                        filename: './logs/literals.log',
                        level: 'literals',
			json: false
                })
        ],
        levels: {
                literals: 1
        }
});
// ================================================================


//winston.add(winston.transports.File, {
//	filename: 'winston.log',
//	json: false
//});


//EXPORTS
module.exports = Parser;


//CODE
function Parser(){

	var _currentChar = "";
	
	//FileState
	var _fileName = "";
	var _fileString = "";
	var _fileLength = 0;
	var _fileIndex = 0;
	
	//LineState
	var _currentLine = 1;
	var _lineCount = 0;
	var _lineArray = [];
	
	//CommentState
	var _insideComment = false;
	var _commentType = "";
	var _commentLength = 0;
	var _forwardSlashCount = 0;
	var _multiLineEndStar = false;

	var _tempCommentObject = {};
	
	var resetTempComment = function(){
		_tempCommentObject = {
			length: 0,
			text: "",
			multiLine: false,
			startLine: 0,
			endLine: 0
		};
	};
	resetTempComment();
	
	/*
	*
	*	test multiline
	*/
	
	//StringState
	var _insideString = false;
	var _stringType = "";
	var _stringEscapeChar = false;
	var _tempStringObject = {};
	
	var resetTempString = function(){
		_tempStringObject = {
			length: 0,
			text: "",
			startLine: 0,
			endLine: 0
		};
	};
	resetTempString();
	
	//Regular Expression Stuff
	var _insideRegExp = false;
	var _regExpEscapeChar = false;
	var _regExpSpecialChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$)}]<>";
	var _regExpRestriction = false;
	var _tempRegExpObject = {};
	
	var resetTempRegExp = function(){
		_tempRegExpObject = {
			length: 0,
			text: "",
			startLine: 0,
			endLine: 0
		};
	};
	resetTempRegExp();

	// ================================ FUNCTION ================================
	// ==========================================================================
	var functionText = ['f', 'u', 'n', 'c', 't', 'i', 'o', 'n'];
	var functionCheckIndex = 0;
	var functionFlag = false;
	var functionDepth = 0;

	// This is required since functions can be nested, unlike comments, strings and regexps
        var _tempFunctionObjectArray = [];

	var _tempFunctionObject = {};

	var resetTempFunctionObject = function(){
		_tempFunctionObject = {
			length: 0,
			text: "",
			startLine: 0,
			endLine: 0,
			parameters: [],
			type: "",
			name: "",
			anonymous: false
		};
	};
	resetTempFunctionObject();

	var updateTempFunctionObjects = function(){
		for(i=0;i<_tempFunctionObjectArray.length;i++){
			_tempFunctionObjectArray[i].length++;
			_tempFunctionObjectArray[i].text += _currentChar;
		}
	};

	var openedFunction = false;
	// ==========================================================================
	// ==========================================================================














	// ============================= OBJECT LITERALS ============================
        // ==========================================================================
	var literalObjectFlag = false;
	var literalDepth = 0;

	var _tempLiteralObjectArray =[];

	var _tempLiteralObject = {};

	var resetTempLiteralObject = function(){
		_tempLiteralObject = {
                	length: 0,
                	text: "",
                	startLine: 0,
                	endLine: 0,
                	propertyCount: 0,
                	propertyNames: []
		};
	};

	resetTempLiteralObject();

	var updateTempLiteralObjects = function(){
		for(i=0;i<_tempLiteralObjectArray.length;i++){
			_tempLitObject =_tempLiteralObjectArray[i];
			_tempLitObject.length++;
			_tempLitObject.text += _currentChar;
		}
	};

	var backwardsScan = function(stopString){
		var backwardsIndex = _fileIndex;
		var leadingChar = _fileString[backwardsIndex];


		while(stopString.indexOf(leadingChar) == -1){
			leadingChar = _fileString[backwardsIndex--];
		}

		return leadingChar;

	};



	// ==========================================================================
        // ==========================================================================
	
	var alphaString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var numericString = "0123456789";

	var bracketStack = [];
	
	//Object Arrays
	var _commentObjects = [];
	var _stringObjects = [];
	var _regExpObjects = [];
	var _functionObjects = [];
	var _literalObjects = [];
	
	var parseChar = {
		"default": function(){
			if(_insideComment){
				_commentLength++;
				_tempCommentObject.text += _currentChar;
				_tempCommentObject.length++;
				
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//Not supposed to be here
				}
				
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += _currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
			} else if (_insideRegExp){
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					if(_regExpEscapeChar){
						_regExpEscapeChar = false;
					}
			} else {
				
				if(_forwardSlashCount === 1){
					//will enter this block only for reg exp or division statements
					_forwardSlashCount = 0;
					
					if(_currentChar != " "){
						
						if(_regExpRestriction){
							
							_regExpRestriction = false;
						} else {
							_insideRegExp = true;
							_tempRegExpObject.length++;
							_tempRegExpObject.text += _currentChar;
						}
						
					} else {
						//currently do nothing
						//case with "/ stuff"
						resetTempRegExp();
					}
				}				
				
				//Check if special char to enable regExpRestriction
				if((_regExpSpecialChars.indexOf(_currentChar) > -1)){
					if(_regExpRestriction){
						
					} else {
						_regExpRestriction = true;
					}
				} else {
					if(_regExpRestriction){
						//
						_regExpRestriction = false;
					} 
				}	
				
				//Letters only go here
				if((alphaString.indexOf(_currentChar) > -1)){
					
					if(_currentChar === functionText[functionCheckIndex]){
						functionCheckIndex++;
						if(functionCheckIndex === 8){
							//If next char is a space or (, it is indeed a function. Otherwise, its a 
							//variable or typo!!
							if(_fileString[_fileIndex+1] === " " || _fileString[_fileIndex+1] === "("){
								functionFlag = true;
							        functionDepth++;
								bracketStack.push("function");
								openedFunction = true;

								_tempFunctionObject.startLine = _currentLine;
								_tempFunctionObject.length = 8;
								_tempFunctionObject.text = "function";
								functionCheckIndex = 0;
								
								//var leadingChar = "";
								//var backwardsIndex = _fileIndex - 8;
								
								//while(leadingChar !== "=" && leadingChar !== ":" && leadingChar !== "\n"){
								//	leadingChar = _fileString[backwardsIndex--];
								//}
							
								var leadingChar = backwardsScan("=:\n");

								if(leadingChar === "="){
									_tempFunctionObject.type = "assignment";
								} else if(leadingChar === ":"){
									_tempFunctionObject.type = "property";
								} else if(leadingChar === "\n"){
									_tempFunctionObject.type = "declaration";
								} else {
									//Shouldn't be here!
								}
								//console.log("Start1: " + _tempFunctionObject.startLine);
								var copy = JSON.parse(JSON.stringify(_tempFunctionObject));
								//console.log("Start2: " + copy.startLine);
								_tempFunctionObjectArray.push(copy);
								resetTempFunctionObject();
								
								
							} else {
								functionCheckIndex = 0;
							}
						}
					} else {
						functionCheckIndex = 0;
					}
				//Numbers only go here
				} else if((numericString.indexOf(_currentChar) > -1)){
				
				}
			}
		},
		
		
		
		" ":  function(){
			if(_insideComment){
				_commentLength++;
				_tempCommentObject.text += _currentChar;
				_tempCommentObject.length++;
				
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//Not supposed to be here
				}
				
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += _currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
			} else if (_insideRegExp){
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					if(_regExpEscapeChar){
						_regExpEscapeChar = false;
					}
			} else {
				
				if(_forwardSlashCount === 1){
					//will enter this block only for reg exp or division statements
					_forwardSlashCount = 0;
					resetTempRegExp();
				}				
				
			}
		},
		
		"/": function(){
		
			if(_insideComment){
				if(_commentType === "single"){
					//Proceed as normal
				} else if(_commentType === "multi") {
					if(_multiLineEndStar === true){
						//End the multi line comment
						_forwardSlashCount = 0;
						_insideComment = false;
						_tempCommentObject.multiLine = true;
						_tempCommentObject.endLine = _currentLine;
						_commentType = "";
						
						//Create the multiline comment object
						if(_commentLength > 0){
							var copy = JSON.parse(JSON.stringify(_tempCommentObject));
							_commentObjects.push(copy);
							
							_commentLength = 0;
						} else {
							//Empty multi-line comment
						}
						
						resetTempComment();
					} else {
						_commentLength++;
						_tempCommentObject.text += _currentChar;
						_tempCommentObject.length++;
					}
				} else {
					//Cannot have this comment type. Only single or multi.
				}
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += _currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
				
			} else if(_insideRegExp){
				if(_regExpEscapeChar){
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					_regExpEscapeChar = false;
				} else {
					_insideRegExp = false;
				
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					_tempRegExpObject.endLine = _currentLine;
				
					var regExpCopy = JSON.parse(JSON.stringify(_tempRegExpObject));	
					_regExpObjects.push(regExpCopy);
					resetTempRegExp();
				}
			} else {
				//Only increment this if NOT already in a comment, and NOT in a string.
				_forwardSlashCount++;
				if(_forwardSlashCount === 2){
					_insideComment = true;
					_commentType = "single";
					_forwardSlashCount = 0;
					_tempCommentObject.startLine = _currentLine;
					
					resetTempRegExp();
					
				} else {
					//Could potentially be a reg exp
					//Must be first char after an =, (, {, [, |, !, #, %, ^, &, *, -, +, \, ?, :, ;
					//Or, NOT after letter, number, @, $, ), }, ], <, >,

					if(_regExpRestriction){
						//
					} else {
						resetTempRegExp();
					
						_tempRegExpObject.length++;
						_tempRegExpObject.text += _currentChar;
						_tempRegExpObject.startLine = _currentLine;
					}
				}
			
			}		
		},
		
		"\\": function(){
			if(_insideComment){
				//continue as normal
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//not supposed to be here
				}
			} else if (_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += _currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				} else {
					_stringEscapeChar = true;
				}	
			} else if(_insideRegExp){
				//continue as normal
				_tempRegExpObject.length++;
				_tempRegExpObject.text += _currentChar;
				if(_regExpEscapeChar){
					_regExpEscapeChar = false;
				} else {
					_regExpEscapeChar = true;
				}
				
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					_regExpEscapeChar = true;
					_insideRegExp = true;
				}
				
				if(_regExpRestriction){
					_regExpRestriction = false;
				}
			}
		},
		
		//String detector
		"'": function(){
			
			if(_insideComment){
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//not supposed to be here
				}
			} else if(_insideString){
				if(_stringType === "single"){
					_insideString = false;
					_stringType = "";
					_tempStringObject.endLine = _currentLine;
					var copy = JSON.parse(JSON.stringify(_tempStringObject));
					_stringObjects.push(copy);
					resetTempString();
				} else if(_stringType === "double"){
					_tempStringObject.length++;
					_tempStringObject.text += _currentChar;
				} else {
					//Cannot have a stringType like this!
				}
				
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += _currentChar;
			} else {
				if(_forwardSlashCount === 1){
					_insideRegExp = true;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
					_forwardSlashCount = 0;
				} else {
					_insideString = true;
					_stringType = "single";
					_tempStringObject.startLine = _currentLine;
				}
				
				if(_regExpRestriction){
					_regExpRestriction = false;
				}
			}		
		},
		
		//String detector
		"\"": function(){

			if(_insideComment){
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//not supposed to be here
				}
			} else if(_insideString){
				if(_stringType === "single"){
					_tempStringObject.length++;
					_tempStringObject.text += _currentChar;
				} else if(_stringType === "double"){
					if(_stringEscapeChar){
						_tempStringObject.length++;
						_tempStringObject.text += _currentChar;
						_stringEscapeChar = false;
					} else {
						_insideString = false;
						_stringType = "";
						_tempStringObject.endLine = _currentLine;
						var copy = JSON.parse(JSON.stringify(_tempStringObject));
						_stringObjects.push(copy);
						resetTempString();
					}
				} else {
					//Cannot have a stringType like this!
				}
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += _currentChar;
			
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_insideRegExp = true;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += _currentChar;
				} else {
					_insideString = true;
					_stringType = "double";
					_tempStringObject.startLine = _currentLine;
				}
				
				if(_regExpRestriction){
					_regExpRestriction = false;
				}
			}
			
			if(_forwardSlashCount === 1){
				_forwardSlashCount = 0;
			}
		},
		
		"\r": function(){
			//Currently ignore carriage returns
		},
		
		"\n": function(){
			
			if(_forwardSlashCount === 1){
				_forwardSlashCount = 0;
			}
			
			if(_insideComment){
				if(_commentType === "single"){
					_insideComment = false;
					_tempCommentObject.endLine = _currentLine;
					//Normal single line comment
					if(_commentLength > 0){
						var copy = JSON.parse(JSON.stringify(_tempCommentObject));
						_commentObjects.push(copy);
						resetTempComment();
						_commentLength = 0;
					//Special case of single line comment - "//\n" - Essentially a useless comment
					} else {
						//console.log("special case");
					}
				} else if(_commentType === "multi"){
					// 
				} else {
					//Houston we have a problem
				}
			} else if(_insideString){
			
			} else if(_insideRegExp){
			
			} else {
				if(_regExpRestriction){
					_regExpRestriction = false;
				}
			}
			
			_currentLine++;
		
		},
		
		"\t": function(){
			if(_forwardSlashCount === 1){
				_forwardSlashCount = 0;
			}
			
			if(_insideComment){
				if(_commentType === "single"){
					//do something
				} else if(_commentType === "multi"){
					if(_multiLineEndStar){
						_multiLineEndStar = false;
					}
				} else {
					//not supposed to be here
				}
			} else {
			
			}
		},	
		
		
		"*": function(){
			if(_insideComment){
				//Single line comment
				if(_commentType === "single"){
					
				//Multi-line comment
				} else if (_commentType === "multi") {
					if(_multiLineEndStar){
						//add as normal
						_commentLength++;
						_tempCommentObject.text += _currentChar;
						_tempCommentObject.length++;
					}
					_multiLineEndStar = true;
				} else {
					//Can't have this type of comment!
				}
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += _currentChar;
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += _currentChar;
				if(_regExpEscapeChar){
					_regExpEscapeChar = false;
				}
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_insideComment = true;
					_commentType = "multi";
					_tempCommentObject.startLine = _currentLine;
				}
				
				if(_regExpRestriction){
					_regExpRestriction = false;
				}
			}
				
			
		},

		//handle {
		"{": function(){
			if(_insideComment){

			} else if(_insideString){

			} else if(_insideRegExp){

			} else {
				if(!openedFunction){
					//Need to do a backwards check.
					//If = OR : is reached, its a literal.a

					// Literals should always have: =, :,or , to the left.
					//	
					// Control statements should always have: ), e, or o to the left.
					//	if (foo == 1){
					//
					//	else {
					//
					//	
					var leadingChar = backwardsScan("=:)eo,");

					if(leadingChar === "=" || leadingChar === ":" || leadingChar === ","){
						//object literal
						literalObjectFlag = true;
						literalDepth++;
						bracketStack.push("literal");

						_tempLiteralObject.startLine = _currentLine;
						var copy = JSON.parse(JSON.stringify(_tempLiteralObject));
						_tempLiteralObjectArray.push(copy);
						resetTempLiteralObject();
					} else {
						//control statement
						bracketStack.push("control");
					}
				} else {
					openedFunction = false;
				}
			}
		},

		// handle }
		"}": function(){
			if(_insideComment){
	
			} else if(_insideString){
	
			} else if(_insideRegExp){
	
			} else {
				var lastOpenBracketType = bracketStack.pop();

				if(lastOpenBracketType == "function") {
					functionDepth--;
					var functionCopy = _tempFunctionObjectArray.pop();
					functionCopy.text += "}";
					functionCopy.endLine = _currentLine;
					_functionObjects.push(functionCopy);

				} else if(lastOpenBracketType == "literal"){
					literalDepth--;
					var literalCopy = _tempLiteralObjectArray.pop();
					literalCopy.text += "}";
					literalCopy.endLine = _currentLine;

					_literalObjects.push(literalCopy);
					resetTempLiteralObject();
				} else if(lastOpenBracketType == "control"){	

				}
			}
		}
	};

	//Bind each function in parseChar to the instance
	for (key in parseChar){
		if(parseChar.hasOwnProperty(key)){
			parseChar[key] = parseChar[key].bind(this);
		}
	
	}
	
	
	this.parse = function(fileName){
		
		//File Stuff
		_fileName 						= fileName;
		_fileString						= fs.readFileSync(fileName, 'utf8');
		_fileLength						= _fileString.length;
		
		//Line Stuff
		_lineArray						= _fileString.split('\n');
		_lineCount						= _lineArray.length;
        
		console.log(_lineCount + ' lines of code in source file');	
		
		
		//Main parsing loop
		for(_fileIndex=0;_fileIndex<_fileLength;_fileIndex++){
			
			_currentChar = _fileString.charAt(_fileIndex);

			//If a special char, use its handler. Otherwise, use the default handler.
			if(parseChar[_currentChar]){
				parseChar[_currentChar]();
			} else {
				parseChar["default"]();
			}

			if(_tempFunctionObjectArray.length > 0){
                                updateTempFunctionObjects();
                        }

			if(_tempLiteralObjectArray.length > 0){
				updateTempLiteralObjects();
			}	
		}
	};
	
	this.dumpStrings = function(){
		if (_stringObjects.length === 0){
			stringLogger.log('strings', "No strings!");
		} else {
			for(var i=0;i<_stringObjects.length;i++){
				stringLogger.log('strings', _stringObjects[i]);
				console.log("dumping strings...");
			}
		}
	};
	
	this.dumpRegularExpressions = function(){
		if (_regExpObjects.length === 0){
			regularExpressionLogger.log('regexps', "No regular expressions!");
		} else {
			for(var i=0;i<_regExpObjects.length;i++){
				regularExpressionLogger.log('regexps', _regExpObjects[i]);
				console.log("dumping regexps...");
			}
		}
	};
	
	this.dumpComments = function(){
		if (_commentObjects.length === 0){
			commentLogger.log('comments', "No comments!");
		} else {
			for(var i=0;i<_commentObjects.length;i++){
				commentLogger.log('comments', _commentObjects[i]);
				console.log("dumping comments...");
			}
		}
	};
	
	this.dumpFunctions = function(){
		if (_functionObjects.length === 0){
			functionLogger.log('functions', "No functions!");
		} else {
			for(var i=0;i<_functionObjects.length;i++){
				functionLogger.log('functions', _functionObjects[i]);
				console.log("dumping functions...");
			}
		}
	};

	this.dumpObjectLiterals = function(){
		if (_literalObjects.length === 0){
			literalLogger.log('literals', "No object literals!");
		} else {
			for(var i=0;i<_literalObjects.length;i++){
				literalLogger.log('literals', _literalObjects[i]);
				console.log("dumping literals...");
			}
		}

	};
}
