var fs = require('fs');
var process = require('process');
var _ = require('underscore-node');

var markdownParser = require('./parser.js');

var fileName = process.argv[2];

if(!fileName) {
    console.log('need a file name');
    process.exit(1);
}

var getOriginalText = new Promise(function(resolve, reject) {
    fs.readFile(fileName, function (err, data) {
        if(err) {
            reject(err);
            return;
        }

        resolve(data.toString());
    });
});

getOriginalText.then(function(data) {
    var result = markdownParser.parse(data);
    console.log(JSON.stringify(result));
}).catch(function (err) {
    console.log(err);
});
