import React from "react";
import { Link as GatsbyLink, GatsbyLinkProps } from "gatsby";
import { useI18n } from "./I18nContext";
import { getDestinationSQ } from "../helpers";

type GatsbyI18nLinkProps<TState> = Omit<GatsbyLinkProps<TState>, "to"> & {
  route?: string;
  locale?: string;
  /**
   * to becomes optional here, as this component will usually be used with
   *`route` prop instead, we might even override `to` but it's more clear and
   * transparent to use a different prop as the value passed to it is not the
   * same as the one you would pass to `to`.
   */
  to?: string;
  // children?: ReactNode;
};

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

  return <GatsbyLink {...props} />;
};
