import React from 'react';
import Helmet from 'react-helmet';
import { graphql, StaticQuery } from 'gatsby';
import { ThemeProvider } from 'emotion-theming';
import Header from './header';
import Footer from './footer';
import GlobalStyles from '../global-styles';
import theme from '../theme';

const LAYOUT_QUERY = graphql`
  query layoutQuery {
    site {
      siteMetadata {
        title
        description
      }
    }
    footer: file(relativePath: { regex: "/global/" }) {
      childDataYaml {
        footer {
          buttons {
            url
            name
          }
        }
      }
    }
  }
`;

const Layout = ({ hasPageHero, children }) => {
  return (
    <StaticQuery query={LAYOUT_QUERY}>
      {data => {
        const { title, description } = data.site.siteMetadata;

        return (
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Helmet defaultTitle={title} titleTemplate={`%s | ${title}`}>
              <meta name="description" content={description} />
              <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,700,900|Roboto+Mono:400,700"
              />
            </Helmet>
            <Header hasHeroBelow={hasPageHero} />
            {children}
            <Footer buttons={data.footer.childDataYaml.footer.buttons} />
          </ThemeProvider>
        );
      }}
    </StaticQuery>
  );
};

export default Layout;
