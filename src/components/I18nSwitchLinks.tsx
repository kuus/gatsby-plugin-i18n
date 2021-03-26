import React, { FC } from "react";
import { useI18n } from "./I18nContext";
import { Link } from "./Link";
import { t } from "../helpers";

export const I18nSwitchLinks: FC<{}> = () => {
  const { currentLocale, alternates } = useI18n();

  return (
    <>
      {alternates.map(({ locale, url }) => (
        <Link
          key={locale}
          to={url}
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
