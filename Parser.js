//IMPORTS
var fs = require('fs');
var winston = require('winston');

winston.add(winston.transports.File, {
	filename: 'winston.log',
	json: false
});


//EXPORTS
module.exports = Parser;


//CODE
function Parser(){

	var currentChar = "";
	
	//FileState
	var _fileName = "";
	var _fileString = "";
	var _fileLength = 0;
	
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
	var _tempCommentObject = {
		length: 0,
		text: "",
		multiLine: false,
		startLine: 0,
		endLine: 0
	};
	
	var resetTempComment = function(){
		_tempCommentObject = {
			length: 0,
			text: "",
			multiLine: false,
			startLine: 0,
			endLine: 0
		};
	}
	
	/*
	*
	*	test multiline
	*/
	
	//StringState
	var _insideString = false;
	var _stringType = "";
	var _stringEscapeChar = false;
	var _tempStringObject = {
		length: 0,
		text: "",
		startLine: 0,
		endLine: 0
	};
	
	var resetTempString = function(){
		_tempStringObject = {
			length: 0,
			text: "",
			startLine: 0,
			endLine: 0
		};
	}
	
	//Regular Expression Stuff
	var _insideRegExp = false;
	var _regExpEscapeChar = false;
	var _regExpSpecialChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$)}]<>";
	var _regExpRestriction = false;
	var _tempRegExpObject = {
		length: 0,
		text: "",
		startLine: 0,
		endLine: 0
	};
	
	var resetTempRegExp = function(){
		_tempRegExpObject = {
			length: 0,
			text: "",
			startLine: 0,
			endLine: 0
		};
	}
	
	
	//Object Arrays
	var _commentObjects = [];
	var _stringObjects = [];
	var _regExpObjects = [];
	
	var parseChar = {
		"default": function(){
			if(_insideComment){
				_commentLength++;
				_tempCommentObject.text += currentChar;
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
				_tempStringObject.text += currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
			} else if (_insideRegExp){
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					if(_regExpEscapeChar){
						_regExpEscapeChar = false;
					}
			} else {
				//currently do nothing
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					if(currentChar != " "){
						_insideRegExp = true;
						_tempRegExpObject.length++;
						_tempRegExpObject.text += currentChar;
					} else {
						//currently do nothing
						resetTempRegExp();
					}
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
						_commentType = "";
						
						//Create the multiline comment object
						if(_commentLength > 0){
							_commentObjects.push(_tempCommentObject);
							resetTempComment();
							_commentLength = 0;
						} else {
							//Empty multi-line comment
						}
					} else {
						_commentLength++;
						_tempCommentObject.text += currentChar;
						_tempCommentObject.length++;
					}
				} else {
					//Cannot have this comment type. Only single or multi.
				}
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
				
			} else if(_insideRegExp){
				if(_regExpEscapeChar){
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					_regExpEscapeChar = false;
				} else {
					_insideRegExp = false;
				
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					_tempRegExpObject.endLine = _currentLine;
					
					_regExpObjects.push(_tempRegExpObject);
					winston.log('info', _tempRegExpObject);
					resetTempRegExp();
				}
			} else {
				//Only increment this if NOT already in a comment, and NOT in a string.
				_forwardSlashCount++;
				if(_forwardSlashCount === 2){
					_insideComment = true;
					_commentType = "single";
					_forwardSlashCount = 0;
					
					resetTempRegExp();
					
				} else {
					//Could potentially be a reg exp
					//Must be first char after an =, (, {, [, |, !, #, %, ^, &, *, -, +, \, ?, :, ;
					//Or, NOT after letter, number, @, $, ), }, ], <, >, 
					resetTempRegExp();
					
					//var test = ./ff
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					_tempRegExpObject.startLine = _currentLine;
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
				_tempStringObject.text += currentChar;
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				} else {
					_stringEscapeChar = true;
				}	
			} else if(_insideRegExp){
				//continue as normal
				_tempRegExpObject.length++;
				_tempRegExpObject.text += currentChar;
				if(_regExpEscapeChar){
					_regExpEscapeChar = false;
				} else {
					_regExpEscapeChar = true;
				}
				
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					_regExpEscapeChar = true;
					_insideRegExp = true;
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
					_stringObjects.push(_tempStringObject);
					resetTempString();
				} else if(_stringType === "double"){
					_tempStringObject.length++;
					_tempStringObject.text += currentChar;
				} else {
					//Cannot have a stringType like this!
				}
				
				if(_stringEscapeChar){
					_stringEscapeChar = false;
				}
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += currentChar;
			} else {
				if(_forwardSlashCount === 1){
					_insideRegExp = true;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
					_forwardSlashCount = 0;
				} else {
					_insideString = true;
					_stringType = "single";
					_tempStringObject.startLine = _currentLine;
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
					_tempStringObject.text += currentChar;
				} else if(_stringType === "double"){
					if(_stringEscapeChar){
						_tempStringObject.length++;
						_tempStringObject.text += currentChar;
						_stringEscapeChar = false;
					} else {
						_insideString = false;
						_stringType = "";
						_tempStringObject.endLine = _currentLine;
						_stringObjects.push(_tempStringObject);
						resetTempString();
					}
				} else {
					//Cannot have a stringType like this!
				}
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += currentChar;
			
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_insideRegExp = true;
					_tempRegExpObject.length++;
					_tempRegExpObject.text += currentChar;
				} else {
					_insideString = true;
					_stringType = "double";
					_tempStringObject.startLine = _currentLine;
				}
			}
			
			if(_forwardSlashCount === 1){
				_forwardSlashCount = 0;
			}
		},
		
		"\n": function(){
			_currentLine++;
			
			if(_forwardSlashCount === 1){
				_forwardSlashCount = 0;
			}
			
			if(_insideComment){
				if(_commentType === "single"){
					_insideComment = false;
					//Normal single line comment
					if(_commentLength > 0){
						_commentObjects.push(_tempCommentObject);
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
			} else {
			
			}
		
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
						_tempCommentObject.text += currentChar;
						_tempCommentObject.length++;
					}
					_multiLineEndStar = true;
				} else {
					//Can't have this type of comment!
				}
			} else if(_insideString){
				_tempStringObject.length++;
				_tempStringObject.text += currentChar;
			} else if(_insideRegExp){
				_tempRegExpObject.length++;
				_tempRegExpObject.text += currentChar;
				if(_regExpEscapeChar){
					_regExpEscapeChar = false;
				}
			} else {
				if(_forwardSlashCount === 1){
					_forwardSlashCount = 0;
					_insideComment = true;
					_commentType = "multi";
				}
			}
				
			
		}
	};

	//Bind each function in parseChar to the instance
	for (key in parseChar){
		parseChar[key] = parseChar[key].bind(this);
	
	}
	
	
	this.parse = function(fileName){
		
		//File Stuff
		var _fileName 						= fileName;
		var _fileString						= fs.readFileSync(fileName, 'utf8');
		var _fileLength						= _fileString.length;
		
		//Line Stuff
		var _lineArray						= _fileString.split('\n');
		var _lineCount						= _lineArray.length;
        
		console.log(_lineCount + ' lines of code in source file');	
		
		//Main parsing loop
		for(var i=0;i<_fileLength;i++){
			currentChar = _fileString.charAt(i);

			//If a special char, use its handler. Otherwise, use the default handler.
			if(parseChar[currentChar]){
				parseChar[currentChar]();
			} else {
				parseChar["default"]();
			}	
		}
	};
	
	this.dumpStrings = function(){
		console.log("\\");
		var longestLength = 0;
		var longestStartLine = 0;
		var longestEndLine = 0;
		var longestStr = "";
		for(var i=0;i<_stringObjects.length;i++){
			var string = _stringObjects[i].text;
			if(string.length > longestLength){
				longestLength = string.length;
				longestStr = string;
				longestStartLine = _stringObjects[i].startLine;
				longestEndLine = _stringObjects[i].endLine;
			}
			
			if(string.length > 72){
				break;
			};
			//console.log("String #" + i + " - Line  " + _stringObjects[i].startLine + ": " + string);
			if(i === 13943){
				//console.log("String #" + i + " - Line  " + _stringObjects[i].startLine + ": " + string);
			}
		}
		console.log(longestStr);
		console.log("Length: " + longestLength);
		console.log("Start: " + longestStartLine);
		console.log("End: " + longestEndLine);
	}
}