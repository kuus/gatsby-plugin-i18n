declare namespace GatsbyI18n {
  // type Options = ReturnType<import("./utils/options").getOptions>;

  type Options = {
    /** @default false */
    debug: boolean;
    /** @default "src/content/settings/i18n" */
    pathConfig: string;
    /** @default "src/content/settings/i18n/messages" */
    pathMessages: string;
    /** @default ["src/content"] */
    pathContent: string[];
    /** @default ["admin"] */
    excludePaths?: string[];
    /** @default "tpl.tsx" */
    templateName?: string;
    /** @default null */
    untranslatedComponent?: string;
    /** @default true */
    useMdx?: boolean;
    /** @default "slug" */
    frontmatterKeyForLocalisedSlug?: string;
    // netlify/server related options:
    /** @default true */
    hasSplatRedirects?: boolean;
  };

  type Config = {
    /** @default  "" */
    baseUrl: string;
    /** @default  ["en"] */
    locales: string[];
    /** @default  "en" */
    defaultLocale: string;
    /** @default  false */
    // enforceLocalisedUrls: false;
    /** @default  true */
    hideDefaultLocaleInUrl: boolean;
  };

  /** The `key` is the `locale` */
  type Route = { [key: string]: string };
  // type RoutesMap = object;
  
  /** The `key` is the `routeId` */
  type RoutesMap = { [key: string]: Route };
  // type RoutesMap = { [key: string]: { [key: string]: string } };
  // type RoutesMap = object;

  type PageContext = {
    i18n: {
      locales: string[];
      defaultLocale: string;
      currentLocale: string;
      messages: { [key: string]: string };
    };
  };
}
