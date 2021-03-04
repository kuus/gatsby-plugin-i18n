declare namespace GatsbyI18n {
  export interface Route {
    string: string;
  }

  export interface Routes {
    string: Route;
  }

  export interface PageContext {
    defaultLanguage: string;
    currentLanguage: string;
    languages: string[];
    messages: { [key: string]: string };
    routes: Routes;
  }
}
