import React, { FC } from "react";
import { useI18n } from "./I18nContext";
import { navigate, t } from "../helpers";

export const I18nSwitch: FC<{}> = () => {
  const i18n = useI18n();

  return (
    <>
      {i18n.locales.map((locale) => (
        <span
          key={locale}
          onClick={() => navigate(i18n, locale)}
          style={{
            fontWeight: i18n.currentLocale === locale ? 600 : 300,
          }}
        >
          {t(`I18nSwitch.${locale}`)}
          {" • "}
        </span>
      ))}
    </>
  );
};
