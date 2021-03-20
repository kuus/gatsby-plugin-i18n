var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.changeLocale = exports.navigate = exports.Link = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _react = _interopRequireDefault(require("react"));

var _gatsby = require("gatsby");

var _I18nContext = require("./I18nContext");

var _utils = require("../utils");

var _routes = _interopRequireDefault(require("../.routes.json"));

// @ts-check

/**
 * Get the localised destination URL based on the given `routeId`
 *
 * Normalising here allows us to write links such as `"pages/about"` instead of
 * `"/pages/about/"` and still match the route key in the `.routes.json` (which
 * corresponds to the markdown file relative path).
 *
 * @param {GatsbyI18n.PageContext["i18n"]} i18n
 * @param {string} routeId
 * @param {string} [locale] It fallbacks to the currentLocale set on i18n page context
 * @returns {string} The URL destination
 */
var getDestination = function getDestination(i18n, routeId, locale) {
  // console.log("getDestination: i18nRoutes", i18nRoutes, "while i18n is", i18n);
  var route = _routes.default[(0, _utils.normaliseRouteId)(routeId)];

  locale = locale || i18n.currentLocale;
  var localisedTo = route ? route[locale] || route[i18n.defaultLocale] : (0, _utils.normaliseUrlPath)(routeId);

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return "" + localisedTo + window.location.search;
};
/**
 * Localised version fo native Gatsby's `<Link>` component
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-gatsby-link
 *
 * @type {React.FC<{
 *   to: string;
 *   params: { [key: string]: string; };
 *   locale?: string;
 *   onClick?: Function;
 * }>}
 */


var Link = /*#__PURE__*/_react.default.forwardRef(function (_ref, ref) {
  var to = _ref.to,
      params = _ref.params,
      locale = _ref.locale,
      children = _ref.children,
      onClick = _ref.onClick,
      restProps = (0, _objectWithoutPropertiesLoose2.default)(_ref, ["to", "params", "locale", "children", "onClick"]);
  var i18n = (0, _I18nContext.useI18n)();
  locale = locale || i18n.currentLocale;
  var destination = getDestination(i18n, to, locale);

  var handleClick = function handleClick(e) {
    if (locale) {
      localStorage.setItem("gatsby-i18n-locale", locale);
    }

    if (onClick) {
      onClick(e);
    }
  }; // TODO: add optional parameters to the destination URL


  if (params) {
    var idx = 1;
    var paramsQuantity = Object.keys(params).length;
    destination += "?";

    for (var paramKey in params) {
      destination += paramKey + "=" + params[paramKey];

      if (idx !== paramsQuantity) {
        destination += "&";
      }

      idx++;
    }
  }

  return /*#__PURE__*/_react.default.createElement(_gatsby.Link, (0, _extends2.default)({
    ref: ref
  }, restProps, {
    to: destination,
    onClick: handleClick
  }), children);
});
/**
 * Localised version of native Gatsby's `navigate`
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-the-navigate-helper-function
 * @param {string} to
 * @param {import("@reach/router").NavigateOptions} options
 */


exports.Link = Link;

var navigate = function navigate(to, options) {
  if (typeof window === "undefined") {
    return;
  }

  var destination = getDestination(window["___gatsbyI18n"], to);
  (0, _gatsby.navigate)(destination, options);
};
/**
 * Change locale helper, to be used in I18nSwitcher component
 *
 * @param {string} locale
 * @param {string} to
 * @returns
 */


exports.navigate = navigate;

var changeLocale = function changeLocale(locale, to) {
  if (typeof window === "undefined") {
    return;
  }

  var destination = getDestination(window["___gatsbyI18n"], to, locale);
  localStorage.setItem("gatsby-i18n-locale", locale);
  (0, _gatsby.navigate)(destination);
};

exports.changeLocale = changeLocale;
var _default = Link;
exports.default = _default;