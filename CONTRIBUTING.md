# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

## Setup

> Install yarn on your system: [https://yarnpkg.com/en/docs/install](https://yarnpkg.com/en/docs/install)

```sh
$ git clone https://github.com/netlify/netlify-cms
$ cd netlify-cms
$ yarn
```

## Building

```sh
$ npm run build
```

## Testing

```sh
$ npm run test
```

```sh
$ npm run test:watch
```

```sh
$ npm run lint
```

## Running the server

```sh
$ npm run start
```

## Pull Requests

We actively welcome your pull requests!

If you need help with GIT or our workflow, please ask on [Gitter.im](https://gitter.im/netlify/NetlifyCMS). We want your contributions even if you're just learning GIT. Our maintainers are happy to help!

Netlify CMS uses the [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows#forking-workflow) + [Feature Branches](https://www.atlassian.com/git/tutorials/comparing-workflows#feature-branch-workflow). Additionally, PR's should be [rebased](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) on master when opened, and again before merging.

1. Fork the repo
2. create a feature branch from `master`. If you're working on an issue, prefix your branch name with {{issue_number}}_description, otherwise use xx_description.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. PR's must be rebased before merge (feel free to ask for help)
7. PR should be reviewed by two maintainers (@erquhart, @Benaiah, @tech4him1) prior to merging.

## Add yourself as a contributor

This project follows the [all contributors](https://github.com/kentcdodds/all-contributors) specification. To add yourself to the table of contributors on the README.md,
please use the automated script as part of your PR:

```console
yarn run add-contributor <YOUR_GITHUB_USERNAME>
```

Follow the prompt. If you've already added yourself to the list and are making a
new type of contribution, you can run it again and select the added contribution
type.

## License

By contributing to Netlify CMS, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
