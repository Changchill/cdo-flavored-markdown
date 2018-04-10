const html = require('remark-html');
const parse = require('remark-parse');
const stringify = require('remark-stringify');
const unified = require('unified');

const renderRedactions = require('./plugins/renderRedactions');
const restoreRedactions = require('./plugins/restoreRedactions');

const redactedLink = require('./plugins/redactedLink');
const tiplink = require('./plugins/tiplink');

module.exports = class CdoFlavoredParser {
  static getPlugins = function() {
    return [redactedLink, tiplink];
  };

  static getParser = function() {
    return unified().use(parse).use(this.getPlugins());
  };

  static sourceToHtml = function(source) {
    return this.getParser().use(html).processSync(source).contents;
  };

  static sourceToRedactedMdast = function(source) {
    return this.getParser().use({ settings: { redact: true } }).parse(source);
  };

  static sourceToRedacted = function(source) {
    const sourceTree = this.sourceToRedactedMdast(source);
    return this.getParser()
      .use(stringify)
      .use(renderRedactions)
      .stringify(sourceTree);
  };

  static sourceAndRedactedToMergedMdast = function(source, redacted) {
    const sourceTree = this.sourceToRedactedMdast(source);
    const redactedTree = this.getParser()
      .use(restoreRedactions(sourceTree))
      .parse(redacted);

    return redactedTree;
  };

  static sourceAndRedactedToHtml = function(source, redacted) {
    const mergedMdast = this.sourceAndRedactedToMergedMdast(source, redacted);
    return this.getParser().use(html).stringify(mergedMdast);
  };

  static sourceAndRedactedToMarkdown = function(source, redacted) {
    const mergedMdast = this.sourceAndRedactedToMergedMdast(source, redacted);
    return this.getParser().use(stringify).stringify(mergedMdast);
  };
};
