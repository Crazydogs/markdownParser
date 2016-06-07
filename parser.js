var regex = {
    list: /^\d+\. /,
    subList: /^(    |\t)\d+\. /,
    subListContent: /^(    |\t){2}/,

    unorderedList: /^- /,
    subUnorderedList: /^(    |\t)- /,
    subUnorderedListContent: /^(    |\t){2}/,
}

var markdownParser = {
}

module.exports = markdownParser;
