var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useI18n = exports.I18nConsumer = exports.I18nProvider = void 0;

var _react = _interopRequireWildcard(require("react"));

var I18nContext = /*#__PURE__*/_react.default.createContext();

var I18nProvider = I18nContext.Provider;
exports.I18nProvider = I18nProvider;
var I18nConsumer = I18nContext.Consumer;
exports.I18nConsumer = I18nConsumer;

var useI18n = function useI18n() {
  return (0, _react.useContext)(I18nContext);
};

exports.useI18n = useI18n;