# Gatsby plugin i18n

## Resources

- [Netlify redirects adn localization](https://docs.netlify.com/routing/redirects/redirect-options/#redirect-by-country-or-language)
- [Gatsby netlify plugin](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-netlify#redirects)

## Similar projects

- [gatsby-plugin-intl](https://github.com/wiziple/gatsby-plugin-intl)
- [using-i18n](https://github.com/gatsbyjs/gatsby/tree/master/examples/using-i18n)
- [gatsby-plugin-i18n](https://github.com/angeloocana/gatsby-plugin-i18n)
- [gatsby-plugin-intl-url](https://github.com/vtellier/gatsby-plugin-intl-url)

## Links

- https://www.gatsbyjs.org/blog/2017-10-17-building-i18n-with-gatsby/
- https://hiddentao.com/archives/2019/05/07/building-a-multilingual-static-site-with-gatsby
- https://react.i18next.com/latest/i18nextprovider
- About 404:
  - https://www.gatsbyjs.org/docs/creating-prefixed-404-pages-for-different-locales/
  - https://github.com/wiziple/gatsby-plugin-intl/blob/master/src/gatsby-node.js#L51-L55
  - https://www.gatsbyjs.org/packages/gatsby-plugin-netlify/

## Issues

### Trailing slashes

Netlify when loading a page directly or refreshing the browser when you are on a page without a trailing slash it will redirect to the same url with a trailing slash, this happens even with `Pretty URLS` setting disabled on Netlify panel. See [this issue](https://github.com/gatsbyjs/gatsby/issues/9207). Until this issue with netlify is not solved we set by default trailing slashed on all paths.

### Custom slugs

- [Custom slugs and Netlify CMS](https://github.com/netlify/netlify-cms/issues/445)
