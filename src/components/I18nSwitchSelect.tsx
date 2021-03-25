import React, { FC } from "react";
import { useI18n } from "./I18nContext";
import { changeLocale, t } from "../helpers";

export const I18nSwitchSelect: FC<{}> = () => {
  const i18n = useI18n();

  return (
    <select
      value={i18n.currentLocale}
      onChange={(e) => changeLocale(i18n, e.target.value)}
    >
      {i18n.locales.map((locale) => (
        <option key={locale} value={locale}>
          {t(`I18nSwitch.${locale}`)}
        </option>
      ))}
    </select>
  );
};
