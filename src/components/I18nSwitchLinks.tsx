import React, { FC } from "react";
import { getCurrentRoute } from "../helpers";
import { useI18n } from "./I18nContext";
import { Link } from "./Link";
import { t } from "../helpers";

export const I18nSwitchLinks: FC<{}> = () => {
  const { locales, currentLocale } = useI18n();
  const route = getCurrentRoute();
  // const localesAvailableForCurrentRoute = Object.keys(route);
  if (!route) {
    return null;
  }

  return (
    <>
      {locales.map((locale) => (
        <Link
          key={locale}
          to={route.locales[locale]}
          style={{
            fontWeight: currentLocale === locale ? 600 : 300,
          }}
        >
          {t(`I18nSwitch.${locale}`)}
          {" • "}
        </Link>
      ))}
    </>
  );
};
