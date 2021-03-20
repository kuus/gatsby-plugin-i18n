var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _taggedTemplateLiteralLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteralLoose"));

var _react = _interopRequireDefault(require("react"));

var _gatsby = require("gatsby");

var _utils = require("../utils");

var _reactHelmet = _interopRequireDefault(require("react-helmet"));

var _routes = _interopRequireDefault(require("../.routes.json"));

var _templateObject;

/**
 * Automatically manage i18n related SEO HTML tags.
 *
 * About alternate meta tags:
 * @see https://support.google.com/webmasters/answer/189077
 *
 * @type {React.FC<{
 *    i18n: GatsbyI18n.PageContext["i18n"];
 *    location: import("@reach/router").WindowLocation;
 * }>}
 */
var I18nSEO = function I18nSEO(_ref) {
  var i18n = _ref.i18n,
      location = _ref.location;
  var currentLocale = i18n.currentLocale,
      locales = i18n.locales;
  var route = (0, _utils.findRouteForPath)(_routes.default, location.pathname);
  var data = (0, _gatsby.useStaticQuery)((0, _gatsby.graphql)(_templateObject || (_templateObject = (0, _taggedTemplateLiteralLoose2.default)(["\n    {\n      site {\n        siteMetadata {\n          siteUrl\n        }\n      }\n    }\n  "])))); // i18N {
  //   defaultLocale
  //   locales
  // }

  return /*#__PURE__*/_react.default.createElement(_reactHelmet.default, {
    htmlAttributes: {
      lang: currentLocale
    }
  }, /*#__PURE__*/_react.default.createElement("meta", {
    property: "og:locale",
    content: currentLocale.replace("-", "_")
  }), route && locales.filter(function (locale) {
    return locale !== currentLocale;
  }).map(function (locale) {
    return !!route[locale] ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, {
      key: locale
    }, /*#__PURE__*/_react.default.createElement("link", {
      rel: "alternate",
      href: data.site.siteMetadata.siteUrl + route[locale],
      hrefLang: locale
    }), /*#__PURE__*/_react.default.createElement("meta", {
      key: locale,
      property: "og:locale:alternate",
      content: locale.replace("-", "_")
    })) : "";
  }));
};

var _default = I18nSEO;
exports.default = _default;