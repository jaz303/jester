module.exports = ParseError;

function ParseError(message, line, column, expectedToken, actualToken) {
    this.name = "ParseError";
    this.message = message;
    this.sourceLine = line;
    this.sourceColumn = column;
    this.expectedToken = expectedToken;
    this.actualToken = actualToken;
}

ParseError.prototype = new Error();
ParseError.prototype.constructor = ParseError;