import React, { FC } from "react";
import { useI18n, Link, getCurrentRoute, t } from "../../index";

export const I18nSwitchLinks: FC<{}> = () => {
  const { locales, currentLocale } = useI18n();
  const route = getCurrentRoute();
  // const localesAvailableForCurrentRoute = Object.keys(route);
  return (
    <>
      {locales.map((locale) => (
        <Link
          key={locale}
          to={route[locale]}
          style={{
            fontWeight: currentLocale === locale ? 600 : 300,
          }}
        >
          {t(`I18nSwitch_${locale}`)}
          {" • "}
        </Link>
      ))}
    </>
  );
};
