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
export const _ = (id, data) => reactUseIntl().formatMessage({ id }, data);

/**
 * @alias _
 */
export const t = _;

export { default as Link, navigate, changeLocale } from "./components/Link";

export { normaliseUrlPath, findRouteForPath, getCurrentRoute } from "./utils";

export { I18nConsumer, useI18n } from "./components/I18nContext";
