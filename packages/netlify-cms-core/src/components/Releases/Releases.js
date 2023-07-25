import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {
  Loader,
} from 'netlify-cms-ui-default';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import {
  loadReleases,
  createRelease,
} from '../../actions/releases';
import { currentBackend } from '../../backend';
import { inc, parse } from 'semver';

class Releases extends Component {
  static propTypes = {
    isFetching: PropTypes.bool,
    isPublishing: PropTypes.bool,
    releases: PropTypes.array,
    loadReleases: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { loadReleases, isGitBackend } = this.props;
    if (isGitBackend) {
      loadReleases();
    }
  }

  render() {
    const {
      isGitBackend,
      isFetching,
      isPublishing,
      loadReleases,
      createRelease,
      releases,
      t,
    } = this.props;

    if (!isGitBackend) return null;
    if (isFetching) return <Loader active>{t('releases.releases.loading')}</Loader>;
    if (isPublishing) return <Loader active>{t('releases.releases.publishing')}</Loader>;
    const releasesCount = releases.length;
    const latestRelease = releases.length ? releases[0] : null;

    const createFirstReleaseCallback = () => {
      createRelease('v0.0.0');
    };

    const bumpMajorVersion = () => {
      createRelease(`v${inc(parse(latestRelease.tag_name), 'major')}`);
    };

    const bumpMinorVersion = () => {
      createRelease(`v${inc(parse(latestRelease.tag_name), 'minor')}`);
    };

    const bumpPatchVersion = () => {
      createRelease(`v${inc(parse(latestRelease.tag_name), 'patch')}`);
    };

    return (
      <div>
        <h1>{t('releases.releases.releasesHeading')}</h1>
        {
          releasesCount
            ? <>
                <p>
                  Latest release: {latestRelease.tag_name}
                </p>
                <p>
                  <button onClick={bumpMajorVersion}>Bump major version</button>
                  <button onClick={bumpMinorVersion}>Bump minor version</button>
                  <button onClick={bumpPatchVersion}>Bump patch version</button>
                </p>
                <h2>Previous releases</h2>
                <ul>
                  {releases.map(release => (
                    <li key={release.tag_name}>
                      <a href={release.html_url}>
                        {release.tag_name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            : <>
              <p>
                No releases yet.
              </p>
              <p>
                <button onClick={createFirstReleaseCallback}>Create first release</button>
              </p>
            </>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { releases, config, globalUI } = state;
  const isGitBackend = currentBackend(config).isGitBackend();
  const returnObj = { releases, isGitBackend };

  if (isGitBackend) {
    returnObj.isFetching = state.releases.isFetching;
    returnObj.isPublishing = state.releases.isPublishing;
    returnObj.releases = state.releases.releases;
  }
  return returnObj;
}

export default connect(mapStateToProps, {
  loadReleases,
  createRelease,
})(translate()(Releases));
