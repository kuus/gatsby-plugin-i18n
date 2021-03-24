const { parse } = require("comment-parser/lib");

// Try to copy paste the below code in the [`comment-parser` playground](https://syavorsky.github.io/comment-parser/#parse-defaults)
// start copying --------

/**
 * I18n
 *
 * @slug {en} /hello/again
 * @slug {it} /ciao/ancora
 */

/**
 * Ignored
 */

const getSlugsFromComment = (source) => {
  const parsed = parse(source);
  const comment =
    parsed.filter((block) => block.description.toLowerCase().includes("i18n"))[0] ||
    null;
  if (!comment) {
    return {};
  }

  const slugs = comment.tags
    .filter((tag) => tag.tag === "slug")
    .reduce((output, tag) => {
      output[tag.type] = tag.name;
      return output;
    }, {});
  
    return slugs;
}
// const stringified = JSON.stringify(getSlugsFromComment(source));

// end copying --------

module.exports = {
  getSlugsFromComment
}
