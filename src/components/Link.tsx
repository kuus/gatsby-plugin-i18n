import React from "react";
import { Link as GatsbyLink, GatsbyLinkProps } from "gatsby";
import { useI18n } from "./I18nContext";
import { getRouteUrl } from "../helpers";

/**
 * `to` becomes optional here, as this component will usually be used with
 *`route` prop instead, we might even override `to` but it's more clear and
 * transparent to use a different prop as the value passed to it is not the
 * same as the one you would pass to `to`.
 */
export type GatsbyI18nLinkProps<TState> = _withTo<TState> | _withRoute<TState>;

type _baseProps<TState> = Omit<GatsbyLinkProps<TState>, "ref" | "to">;

type _withTo<TState> = _baseProps<TState> & {
  route?: undefined;
  locale?: undefined;
  params?: undefined;
  to: string;
};

type _withRoute<TState> = _baseProps<TState> & {
  route: string;
  locale?: string;
  params?: { [key: string]: string };
  to?: undefined;
};

/**
 * Localised version fo native Gatsby's `<Link>` component
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-gatsby-link
 *
 * TODO: check if we need to use `React.forwardRef`
 */
export const Link = React.forwardRef(<TState extends {}>({
  route,
  locale,
  params,
  onClick,
  ...props
}: GatsbyI18nLinkProps<TState>, ref) => {
  if (route) {
    const i18n = useI18n();
    let to = getRouteUrl(i18n, route, locale);

    if (to) {
      const handleClick = (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
      ) => {
        if (locale) {
          localStorage.setItem("gatsby-i18n-locale", locale);
        }
        if (onClick) {
          onClick(e);
        }
      };

      // TODO: add optional parameters to the destination URL
      if (params) {
        let idx = 1;
        let paramsQuantity = Object.keys(params).length;
        to += "?";
        for (const paramKey in params) {
          to += `${paramKey}=${params[paramKey]}`;
          if (idx !== paramsQuantity) {
            to += "&";
          }
          idx++;
        }
      }

      return <GatsbyLink ref={ref} {...props} to={to} onClick={handleClick} />;
    }
  }

  if (props.to) {
    return <GatsbyLink ref={ref} {...props} />;
  }

  return <span data-route={route} ref={ref}>{props.children}</span>;
  // throw new Error("GatsbyI8nLink called without neither `to` nor `route`");
});
