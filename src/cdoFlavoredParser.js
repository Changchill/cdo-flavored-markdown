const html = require('remark-html');
const parse = require('remark-parse');
const stringify = require('remark-stringify');
const unified = require('unified');

const fromRedactedUrls = require('./plugins/fromRedactedUrls');
const redactedUrls = require('./plugins/redactedUrls');

const mergeMdast = require('./mergeMdast');

module.exports = class CdoFlavoredParser {
  static getPlugins = function () {
    return [];
  }

  static getParser = function() {
    return unified().use(parse).use(this.getPlugins());
  };

  static sourceToHtml = function(source) {
    return this.getParser().use(html).processSync(source).contents;
  };

  static sourceToRedacted = function(source) {
    return this.getParser()
      .use({ settings: { redact: true } })
      .use(stringify)
      .use(redactedUrls)
      .processSync(source).contents;
  };

  static sourceAndRedactedToMergedMdast = function(source, redacted) {
    const sourceTree = this.getParser().parse(source);
    const redactedTree = this.getParser().use(fromRedactedUrls).parse(redacted);
    mergeMdast(sourceTree, redactedTree);

    return redactedTree;
  }

  static sourceAndRedactedToHtml = function(source, redacted) {
    const mergedMdast = this.sourceAndRedactedToMergedMdast(source, redacted);
    return this.getParser().use(html).stringify(mergedMdast);
  };

  static sourceAndRedactedToMarkdown = function(source, redacted) {
    const mergedMdast = this.sourceAndRedactedToMergedMdast(source, redacted);
    return this.getParser().use(stringify).stringify(mergedMdast);
  };
};
