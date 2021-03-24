import React from "react";
import { Link as GatsbyLink } from "gatsby";
import { useI18n } from "./I18nContext";
import { getDestinationSQ } from "../helpers";
import { GatsbyI18nLinkProps } from "./Link";

export const Link = <TState extends {}>({
  route,
  locale,
  ...props
}: GatsbyI18nLinkProps<TState>) => {
  if (route) {
    const i18n = useI18n();
    const to = getDestinationSQ(i18n, route, locale);

    if (to) {
      return <GatsbyLink {...props} to={to} />;
    }
  }

  // this is just for typescript...
  if (props.to) {
    return <GatsbyLink {...props} />;
  }

  throw new Error("GatsbyI8nLink called without neither `to` nor `route`");
};
