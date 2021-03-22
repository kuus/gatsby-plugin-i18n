import React, { FC } from "react";
import { useI18n, changeLocale, t } from "../../index";

export const I18nSwitch: FC<{}> = () => {
  const i18n = useI18n();

  return (
    <>
      {i18n.locales.map((locale) => (
        <span
          key={locale}
          onClick={() => changeLocale(i18n, locale)}
          style={{
            fontWeight: i18n.currentLocale === locale ? 600 : 300,
          }}
        >
          {t(`I18nSwitch_${locale}`)}
          {" • "}
        </span>
      ))}
    </>
  );
};
