declare namespace GatsbyI18n {
  export interface Route {
    string: string;
  }

  export interface Routes {
    string: Route;
  }

  export interface PageContext {
    defaultLocale: string;
    currentLocale: string;
    locales: string[];
    messages: { [key: string]: string };
    routes: Routes;
  }
}
