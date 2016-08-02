var _ = require('underscore-node');

var markdownParser = {
    parse: function (originStr) {
        return splitByEmptyRow(originStr)
            .map(parseBlockType)
            .map(parseBlockByType);
    }
} 


/*
 *  根据空行进行切片
 *  in: data 原始字符串
 *  out: 段落数组，每个段落也是数组，包含段落内的行
 */
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

/*
 *  段落分类
 *  in: 段落，如 ['段内第一行', '段内第二行']
 *  out: 带有段落类型的段落数组，段落格式如下
 *      {
 *          type: orderListBlock,
 *          data: ['段内第一行', '段内第二行']
 *      }
 */
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

function parseBlockByType(block) {
    if (block.type === 'orderListBlock' || block.type === 'unorderedListBlock') {
        return {
            type: block.type,
            data: listParser(block.data)
        }
    } else {
        return block;
    }
}

/*
 * 正则表达式
 */
var regex = {
    // 有序列表
    list: /^\d+\. /,
    subList: /^(    |\t)\d+\. /,
    subListContent: /^(    |\t){2}/,
    // 无序列表
    unorderedList: /^- /,
    subUnorderedList: /^(    |\t)- /,
    subUnorderedListContent: /^(    |\t){2}/,
    // 代码
    codeBorder: /^`{4}/,
    // 缩进
    indent: /^(    |\t)/
}
// 检测行类型
function checkLineType(regexs) {
    return function (line) {
        return regexs.some(function (regex) {
            return regex.test(line);
        })
    }
}
// 是否为有序列表
var isOrderListLine = checkLineType([
    regex.list
]);
// 是否为有序列表及其内容
var isOrderListAndContentLine = checkLineType([
    regex.list,
    regex.indent
]);
// 是否为无序列表
var isUnorderListLine = checkLineType([
    regex.unorderedList
]);
// 是否为无序列表及其内容
var isUnorderListAndContentLine = checkLineType([
    regex.unorderedList,
    regex.indent
]);
// 为否为子列表
var isSubListLine = checkLineType([
    regex.subList,
    regex.subListContent,
    regex.subUnorderedList,
    regex.subUnorderedListContent
]);

/*
 *  段落类型匹配器
 */
var blockReconizer = {
    // 有序列表
    orderListBlock: function(block) {
        return block.every(function(row, rowIndex) {
            return rowIndex ? isOrderListAndContentLine(row)
                            : isOrderListLine(row);
        });
    },
    // 无序列表
    unorderedListBlock: function(block) {
        return block.every(function(row, rowIndex) {
            return rowIndex ? isUnorderListAndContentLine(row)
                            : isUnorderListLine(row);
        });
    },
    // 代码
    codeBlock: function(block) {
        return block.length >= 3
                && regex.indent.test(block[0])
                && regex.indent.test(block[block.length - 1]);
    }
};


function findSubList(listItem) {
    return listItem.reduce(function (result, currentLine) {
        if (isSubListLine(currentLine)) {
            if (_.last(result) && _.isArray(_.last(result))) {
                _.last(result).push(currentLine.replace(regex.indent, ''));
                return result;
            } else {
                result.push([currentLine.replace(regex.indent, '')]);
                return result;
            }
        } else {
            result.push(currentLine);
            return result;
        }
    }, []).map(function (item) {
        if (_.isArray(item)) {
            return parseBlockByType(parseBlockType(item));
        }
        return item;
    });
}

/*
 *  列表解析，识别嵌套列表
 *  in: 列表段落
 *      [
 *          '1. 一级列表',
 *          '    一级列表内容',
 *          '    - 二级列表',
 *          '        可以是有序与无序嵌套',
 *          '    一级列表内容',
 *          '2. 一级列表'
 *      ]
 *  out: 
 *      [
 *          [
 *              '1. 一级列表',
 *              '    一级列表内容',
 *              {
 *                  type: 'unorderedList',
 *                  data: [
 *                      '- 二级列表',
 *                      '   可以是有序与无序嵌套'
 *                  ]
 *              },
 *              '   一级列表内容'
 *          ],
 *          [
 *              '2. 一级列表'
 *          ]
 *      ]
 */
function listParser(listBlock) {
    return listBlock.reduce(function(splitedLine, currentLine) {
        if (isOrderListLine(currentLine) || isUnorderListLine(currentLine)) {
            splitedLine.push([currentLine]);
            return splitedLine;
        } else {
            _.last(splitedLine).push(currentLine);
            return splitedLine;
        }
    }, []).map(function (listItem) {
        return findSubList(listItem);
    });
}

module.exports = markdownParser;
