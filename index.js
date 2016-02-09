var cheerio = require('cheerio');
var fs = require('fs');
var slugFn = require('slug');
var _ = require('lodash');
var path = require('path');

function fileLoaded(fileName, _, data) {
  data = prepareHtml(data);
  var $ = cheerio.load(data);
  var result = parse($);

  result.html = postprocessHtml(result.html);

  var htmlName = path.parse(fileName).name;

  fs.writeFileSync('./' + htmlName + '_translation.json', JSON.stringify(result.json, null, 2));

  fs.writeFileSync('./' + htmlName + '_translation.html', result.html);
  console.log('Done!');
}

function prepareHtml(html) {
  function prepareEjs() {
    html = html.replace(/<%([\w\W]*?)%>/g, function(match, subMatch){ return "<!-- <%"+subMatch+"%> -->"; });
  }
  prepareEjs();
  return html;
}

function postprocessHtml(html) {
  function postprocessEjs() {
    html = html.replace(/<!-- <%([\w\W]*?)%> -->/g, function (match, subMatch) { return "<%"+subMatch+"%>"; });

    // Restoring ejs tags that were part of HTML tags attribute
    html = html.replace(/&lt;!-- &lt;%([\w\W]*?)%&gt; --&gt;/g, function (match, subMatch) { return "<%"+subMatch+"%>"; });
    html = html.replace(/&apos;/g, function (match, subMatch) { return "'"; }); // CAUTION: will replace &apos; even if it was put into HTML intentionally
  }
  postprocessEjs();
  return html;
}

function getNodeTextAndHtml(node) {
  var text = node
    .clone()
    .children()
    .remove()
    .end()
    .text();

  var html = node.html();

  return {
    text, html
  };
}

function getSlug (text) {
  var separator = /({{.*?}})/gi;
  var splits = text.split(separator);

  var strings = [];

  _.each(splits, function (s) {
    if (s.indexOf('{{') === 0) {
      return;
    }
    strings.push(s);
  });

  return slugFn(strings.join(' '), {
    replacement: '_',
    symbols: true,
    lower: true
  });
}

function getBindings(text) {
  var separator = /({{.*?}})/gi;
  var splits = text.split(separator);
  var bindings = [];

  _.each(splits, function (s) {
    if (s.indexOf('{{') === 0) {
      bindings.push(s);
    }
  });

  return bindings;
}

function processElement(i, $elem) {
  var result = {};

  var textAndHtml = getNodeTextAndHtml($elem);
  var childrenCount = $elem.children().length;

  var slug = getSlug(textAndHtml.text);
  if (slug.length === 0) {
    // No slug - no need to translate text in node
    return;
  }

  var translatedText;
  if (childrenCount > 0) {
    translatedText = textAndHtml.html;
  } else {
    translatedText = textAndHtml.text;
  }

  $elem.attr('translate', slug);

  $elem.html('');

  var bindings = getBindings(translatedText);
  if (bindings.length > 0) {
    $elem.attr('translate-values', 'REPLACE_' + i + ' ' + bindings.join('::'));
    translatedText = 'REPLACE_' + i + ' ' + translatedText;
  }
  result[slug] = translatedText;

  return result;
}

function parse($) {
  var result = {};
  var counter = 0;
  // $('*').each(function (i, elem) {
  //   var $elem = $(elem);
  //   var processedResult = processElement(i, $elem);
  //   result = _.merge(result, processedResult);
  // });

  function process(elements) {
    elements.each(function (i, elem) {
      var $elem = $(elem);
      var processedResult = processElement(counter++, $elem);
      result = _.merge(result, processedResult);

      if (!processedResult) {
        return process($elem.children());
      }
    });
  }

  process($('html > *'));

  return {
    html: $.html(),
    json: result
  };
}

module.exports = {
  run: function (fileName) {
    console.log('File: ', fileName);

    fs.readFile(fileName, 'utf8', fileLoaded.bind(null, fileName));

  }
};
