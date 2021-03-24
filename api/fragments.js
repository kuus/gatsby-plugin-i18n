// import { graphql } from "gatsby"
// import preval from "babel-plugin-preval";

// export const I18nRouteUrls = graphql`
//   fragment I18nRouteUrls on I18nRoute {
//     fields {

//     }
//   }
// `

// export const I18nRouteUrls = preval`
//   const { getI18nConfig } = require('../utils/internal');
//   const options = getI18nConfig();
//   options.locales
//   module.exports = graphql\`
//     fragment I18nRouteUrls on I18nRoute {
//       fields {

//       }
//     }
//   \`
// `

// FIXME: TODO: dynamically create a graphql fragment with babel-plugin-preval
// that would get all defined locales on the fields object of this query,
// otherwise those fields would need to be hardcoded and would not automatically
// update when adding/removing a language
//  allI18NRoute {
//   nodes {
//     routeId
//     fields {
//       it
//       en
//     }
//   }
// }
// babel-preval example:
// const name = 'Bob Hope'
// const person = preval`
//   const [first, last] = require('./name-splitter')(${name})
//   module.exports = {first, last}
// `
