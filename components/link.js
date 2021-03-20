var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.changeLocale = exports.navigate = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _react = _interopRequireDefault(require("react"));

var _gatsby = require("gatsby");

var _I18nContext = require("../I18nContext");

var _utils = require("../utils");

var _routes = _interopRequireDefault(require("./.routes.json"));

// @ts-check
var getDestination = function getDestination(_ref) {
  var i18n = _ref.i18n,
      to = _ref.to,
      locale = _ref.locale;

  // console.log("getDestination: i18nRoutes", i18nRoutes, "while i18n is", i18n);
  // normalising here allows us to write links such as "pages/about" instead of
  // "/pages/about/" and still match the route key in the `.routes.json` (which
  // corresponds to the markdown file relative path)
  var route = _routes.default[(0, _utils.normaliseUrlPath)(to)];

  locale = locale || i18n.currentLocale;
  var localisedTo = route ? route[locale] || route[i18n.defaultLocale] : to;

  if (typeof window === "undefined") {
    return localisedTo;
  }

  return "" + localisedTo + window.location.search;
}; // const Link = ({ to, locale, children, onClick, ...restProps }) => (


var Link = /*#__PURE__*/_react.default.forwardRef(function (_ref2, ref) {
  var to = _ref2.to,
      params = _ref2.params,
      locale = _ref2.locale,
      children = _ref2.children,
      onClick = _ref2.onClick,
      restProps = (0, _objectWithoutPropertiesLoose2.default)(_ref2, ["to", "params", "locale", "children", "onClick"]);
  var i18n = (0, _I18nContext.useI18n)();
  var destination = getDestination({
    i18n: i18n,
    to: to,
    locale: locale
  });
  locale = locale || i18n.currentLocale;

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

var navigate = function navigate(to, options) {
  if (typeof window === "undefined") {
    return;
  }

  var destination = getDestination({
    i18n: window["___gatsbyI18n"],
    to: to
  });
  (0, _gatsby.navigate)(destination, options);
};

exports.navigate = navigate;

var changeLocale = function changeLocale(locale, to) {
  if (typeof window === "undefined") {
    return;
  }

  var destination = getDestination({
    i18n: window["___gatsbyI18n"],
    to: to,
    locale: locale
  });
  localStorage.setItem("gatsby-i18n-locale", locale);
  (0, _gatsby.navigate)(destination);
};

exports.changeLocale = changeLocale;
var _default = Link;
exports.default = _default;