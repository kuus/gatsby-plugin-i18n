import { useIntl as reactUseIntl } from "react-intl";

// export * from "react-intl";
export { FormattedMessage } from "react-intl";
export const useIntl = reactUseIntl;
export const _ = () => useIntl().formatMessage;

export {
  default as Link,
  navigate,
  changeLocale,
  getCurrentRoute,
} from "./link";

export { normaliseUrlPath, findRouteForPath } from "./utils";

export { I18nConsumer, useI18n } from "./I18nContext";
