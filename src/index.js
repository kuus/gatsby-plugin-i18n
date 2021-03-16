import { useIntl as reactUseIntl } from "react-intl";

// export * from "react-intl";
export { FormattedMessage } from "react-intl";

export const useIntl = reactUseIntl;

/**
 * Output a translated string by id, a shortcut to `useIntl().formatMessage`
 *
 * @param {string} id
 * @param {object} [data]
 * @returns
 */
export const _ = (id, data) => reactUseIntl().formatMessage({ id }, data);

export {
  default as Link,
  navigate,
  changeLocale,
  getCurrentRoute,
} from "./link";

export { normaliseUrlPath, findRouteForPath } from "./utils";

export { I18nConsumer, useI18n } from "./I18nContext";
