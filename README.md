# Gatsby plugin i18n

This plugin is meant to be used with netlify and its [gatsby-plugin-netlify](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-netlify) to correctly handle redirects server side. A less SEO friendly alternative would be to use this plugin alongside [gatsby-plugin-meta-redirect](https://github.com/nsresulta/gatsby-plugin-meta-redirect) or [gatsby-plugin-client-side-redirect](https://github.com/dhakerShiv/gatsby-plugin-client-side-redirect), they all exploit the gatsby's [`createRedirect` action](https://www.gatsbyjs.com/docs/reference/config-files/actions/#createRedirect).

## Resources

- [Netlify redirects adn localization](https://docs.netlify.com/routing/redirects/redirect-options/#redirect-by-country-or-language)
- [Gatsby netlify plugin](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-netlify#redirects)
- Examples of internationalised Gatsby sites:
  - [overreacted.io](https://github.com/gaearon/overreacted.io/blob/master/gatsby-node.js) We might get from there the mechanism that scan the markdown files and auto-localise links.
- Articles:
  - [Building i18n with Gatsby](https://www.gatsbyjs.org/blog/2017-10-17-building-i18n-with-gatsby/)
  - [Building a multilingual static site with Gatsby](https://hiddentao.com/archives/2019/05/07/building-a-multilingual-static-site-with-gatsby)
- About 404:
  - [Gatsby 404 localised 404 pages](https://www.gatsbyjs.com/docs/creating-prefixed-404-pages-for-different-languages/)
  - [Creating prefixed 404 pages for different locales](https://www.gatsbyjs.org/docs/creating-prefixed-404-pages-for-different-locales/)

## Similar projects

There are [many on `npm`](https://www.npmjs.com/search?q=gatsby%20i18n).

- [gatsby-plugin-intl](https://github.com/wiziple/gatsby-plugin-intl)
- [using-i18n](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-i18n)
- [gatsby-plugin-i18n](https://github.com/angeloocana/gatsby-plugin-i18n)
- [gatsby-i18n-plugin](https://github.com/ikhudo/gatsby-i18n-plugin)
- [gatsby-plugin-intl-url](https://github.com/vtellier/gatsby-plugin-intl-url)
- [gatsby-theme-i18n](https://github.com/gatsbyjs/themes/tree/master/packages/gatsby-theme-i18n)
- [gatsby-plugin-translate-urls](https://www.npmjs.com/package/gatsby-plugin-translate-urls)
- [gatsby-theme-localization](https://github.com/onestopjs/gatsby-theme-localization)

## Issues

### Language based redirects

Those that use `Language: locale` in the `createRedirect` method, they seem to do not work at the moment, see [this issue](https://answers.netlify.com/t/language-specific-redirect-not-working/9221/4) or [this one](https://answers.netlify.com/t/language-based-redirect-only-works-when-1-browser-language-set/4252/19) for instance.

### Trailing slashes

Netlify when loading a page directly or refreshing the browser when you are on a page without a trailing slash it will redirect to the same url with a trailing slash, this happens even with `Pretty URLS` setting disabled on Netlify panel. See [this issue](https://github.com/gatsbyjs/gatsby/issues/9207). Until this issue with netlify is not solved we set by default trailing slashed on all paths with the util `normaliseUrlPath`.

### Custom slugs

- [Custom slugs and Netlify CMS](https://github.com/netlify/netlify-cms/issues/445)

## TODO:

- Add support for server side redirects in frontmatter, see [Programmatic Redirects in Gatsby](https://levelup.gitconnected.com/programmatic-redirects-in-gatsby-7009a855e973)
