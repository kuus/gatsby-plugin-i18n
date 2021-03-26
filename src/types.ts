export namespace GatsbyI18n {
  // type Options = ReturnType<import("./utils/options").getOptions>;

  export type Options = {
    /** @default false */
    debug: boolean;
    /** @default "src/content/settings/i18n" */
    configPath: string;
    /** @default "src/content/settings/i18n/messages" */
    messagesPath: string;
    /** @default ["src/content"] */
    contentPaths: string[];
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

  export type Config = {
    /** @default  "" */
    baseUrl: string;
    /** @default  ["en"] */
    locales: string[];
    /** @default  "en" */
    defaultLocale: string;
    /** @default  true */
    hideDefaultLocaleInUrl: boolean;
  };

  /** The `key` is the `locale` */
  export type Route = { [key: string]: string };
  // export type RoutesMap = object;
  
  /** The `key` is the `routeId` */
  export type RoutesMap = { [key: string]: Route };
  // export type RoutesMap = { [key: string]: { [key: string]: string } };
  // export type RoutesMap = object;

  export type I18n = {
    locales: string[];
    defaultLocale: string;
    currentLocale: string;
    messages: { [key: string]: string };
    alternates: {
      locale: string;
      url: string;
      fullUrl: string;
    }[];
    translatedIn?: {
      locale: string;
      url: string;
    }[];
  }; 
  
  export type PageContext = {
    i18n: I18n;
  }; 
}
