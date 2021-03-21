import { useIntl as reactUseIntl } from "react-intl";

// export * from "react-intl";
export { FormattedMessage } from "react-intl";

export const useIntl = reactUseIntl;

/**
 * Output a translated string by id, a shortcut to `useIntl().formatMessage`
 *
 * @param {string} id
 * @param {object} [data]
 * @returns {string}
 */
export const t = (id, data) => reactUseIntl().formatMessage({ id }, data);

export { Link } from "./src/components/Link";

export {
  navigate,
  changeLocale,
  getCurrentRoute,
} from "./src/helpers";

export { I18nConsumer, useI18n } from "./src/components/I18nContext";
