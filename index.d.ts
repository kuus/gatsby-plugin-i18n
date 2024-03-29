// export * from "./index";

declare namespace GatsbyI18n {

  // type Options = ReturnType<import("./utils/options").getOptions>;
  export type Options = {
    /** @default  "" */
    baseUrl: string;
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
    /** @default "identifier" */
    frontmatterKeyForIdentifier?: string;
    // netlify/server related options:
    /** @default true */
    hasSplatRedirects?: boolean;
  };

  export type Config = {
    /** @default  ["en"] */
    locales: string[];
    /** @default  "en" */
    defaultLocale: string;
    /** @default  true */
    hideDefaultLocaleInUrl: boolean;
  };

  /** The `key` is the `routeId` */
  export type Route = Record<string, string>;
  
  /** The `key` is the `locale` */
  export type Routes = Record<string, Route>;

  export type I18n = {
    locales: string[];
    defaultLocale: string;
    currentLocale: string;
    hideDefaultLocaleInUrl: boolean;
    messages: Record<string, string>;
    routes: Record<string, string>;
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
  
  export type Context = {
    i18n: I18n & {
      /**
       * Relative url formatter according to the `currentLocale.
       * 
       * - Important: do not pass here absolute URLs!
       * - It takes into account the `hideDefaultLocaleInUrl` configuration.
       * - It normalises slashes.
       * 
       * This is not add in the `createPages` lifecycle as from there the `pageContext`
       * is serialised before being passed on to the page react component.
       * Therefore we dynamically add to the i18n context this function in the
       * `wrapPageElement` component.
       */
      url: (urlPath?: string) => string;
    };
  }; 
  
  export type PageContext = {
    i18n: I18n;
  }; 
}
