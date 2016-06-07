var fs = require('fs');
var process = require('process');
var _ = require('underscore-node');

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
    console.log(
        splitByEmptyRow(data)
            .map(parseBlockType)
    );
}).catch(function (err) {
    console.log(err);
});

function splitByEmptyRow(data) {
    return data
        .split('\n')
        .reduce(function(preVal, currentVal){
            if (currentVal) {
                preVal[preVal.length - 1].push(currentVal);
            } else {
                if (preVal[preVal.length - 1].length != 0) {
                    preVal.push([]);
                }
            }
            return preVal;
        }, [[]])
        .slice(0, -1);
}

function parseBlockType(block) {
    return _.map(blockReconizer, function(fun, name) {
        if(fun(block)) {
            return {
                type: name,
                data: block
            }
        } else {
            return false;
        }
    }).find(function(result) {
        return result;
    }) || {
        type: 'normal',
        data: block
    };
}


var regex = {
    list: /^\d+\. /,
    subList: /^(    |\t)\d+\. /,
    subListContent: /^(    |\t){2}/
}

var blockReconizer = {
    listBlock: function(block) {
        return block.every(function(row, rowIndex) {
            return rowIndex ? /^(\d+\. |    |\t)/.test(row)
                            : /^\d+\. /.test(row);
        });
    },
    unorderedListBlock: function(block) {
        return block.every(function(row, rowIndex) {
            return rowIndex ? /^(- |    |\t).*/.test(row)
                            : /^- /.test(row);
        });
    },
    codeBlock: function(block) {
        return block.length >= 3
                && /^`{4}/.test(block[0])
                && /^`{4}/.test(block[block.length - 1]);
    }
};

var listParser = function(block) {
    _.map(block, function(row, rowIndex) {
        if(/^(    |\t)\d+\. /.test(row)) {
            return {
                type: 1,
                data: row
            }
        }
        if(/^(    |\t){2}/.test(row)) {
            return {
                type: 2,
                data: row
            }
        }
        if()
        return row;
    });
}


var inlineReconizer = {
    
};
