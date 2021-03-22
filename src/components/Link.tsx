import React, { FC } from "react";
import { Link as GatsbyLink } from "gatsby";
import { getDestination } from "../helpers";

/**
 * Localised version fo native Gatsby's `<Link>` component
 *
 * @see https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-link/#how-to-use-gatsby-link
 *
 * TODO: check if we need to use `React.forwardRef`
 */
export const Link: FC<{
  route: string;
  locale?: string;
  params?: { [key: string]: string };
  onClick?: Function;
}> = ({ route, locale, params, onClick, ...props }) => {
  if (route) {
    let to = getDestination(route, locale);

    if (to) {
      const handleClick = (e) => {
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

      return <GatsbyLink {...props} to={to} onClick={handleClick} />;
    }
  }

  return <GatsbyLink onClick={onClick} {...props} />;
};
