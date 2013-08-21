// Copyright (c) 2013 The Nevermore Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var collectTermsToContext = function() {
    var termsToContext = {};

    // FIXME: We should have a much more generic way to find terms than
    // searching for <u> tags with quotes before or after them.
    var leftQuote = "\u201C";
    var rightQuote = "\u201D";
    var nodeList = document.getElementsByTagName('u');

    for (var i = 0; i < nodeList.length; ++i) {
        var uTag = nodeList[i];
        var previousText = uTag.previousSibling.textContent;
        var nextText = uTag.nextSibling.textContent
        var term = uTag.textContent;
        if (previousText[previousText.length - 1] == leftQuote && nextText[0] == rightQuote)
            termsToContext[term] = uTag;
    };
    return termsToContext;
}

var walkTextNodes = function(node, callback) {
    if (!node)
        return;

    node = node.firstChild;
    while (node) {
        if (node.nodeType == Node.TEXT_NODE)
            callback(node);
        else if (node.nodeType == Node.ELEMENT_NODE)
            walkTextNodes(node, callback);
        node = node.nextSibling;
        // What about shadow DOM?
    }
}

var wrapSubstring = function(text, start, end, wrapper) {
    if (end != text.length)
        text.splitText(end);

    var substringNode;
    if (start)
        substringNode = text.splitText(start);
    else
        substringNode = text;

    substringNode.parentNode.replaceChild(wrapper, substringNode);
    wrapper.appendChild(substringNode);
}

var underlineTerms = function(termsToContext) {
    var termsByLength = Object.keys(termsToContext);
    // Match longer terms first.
    termsByLength.sort(function(a, b) {
        return b.length - a.length;
    });

    walkTextNodes(document.body, function(node) {
        // Hack to work around their broken HTML.
        if (node.parentNode.tagName == "TITLE")
            return;

        for (var i = 0; i < termsByLength.length; ++i) {
            var term = termsByLength[i];
            var text = node.textContent;
            var startIndex = text.indexOf(term);
            if (startIndex == -1)
                continue;
            var endIndex = startIndex + term.length;

            // We're only looking for whole words.
            if (startIndex > 0 && text[startIndex - 1] != " ") // FIXME: What about tabs, periods, etc?
                continue;
            if ((endIndex < text.length) && text[endIndex] != " ")
                continue;

            var definitionContext = termsToContext[term];

            var wrapper = document.createElement('a');
            if (node.parentNode == definitionContext)
                wrapper.id = term;
            else
                wrapper.href = "#" + term;

            wrapSubstring(node, startIndex, endIndex, wrapper);
            return; // Only match the first term.
        }
    });
}

var termsToContext = collectTermsToContext();
underlineTerms(termsToContext);
