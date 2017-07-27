# react-helmet-v5-codemod

Codemod built using jscodeshift to upgrade to version 5 of react-helmet.

[React Helmet](https://github.com/nfl/react-helmet) recently released a new version which makes the API much simpler moving forward. We are using react-helmet in over 40 different files in Docker Store, so I figured it would be best to write a codemod using jscodeshift instead of manually fixing the issues.

The main changes are that almost all of the props on the `<Helmet>` component are now supposed to be provided as children in the form of tags like `<meta>`.
This codemod takes into account the "rules" for translating each of the accepted props from the old version, and translates them to the new API.

For example, what was previously
```
<Helmet
    title="My Title"
    meta={[
        {name: "description", content: "Helmet application"}
    ]}
/>
```
is now

```
<Helmet>
    <title>My Title</title>
    <meta name="description" content="Helmet application" />
</Helmet>
```

I used an [old README](https://github.com/nfl/react-helmet/blob/f392aaef69cce3cd1951dd96e4f860bf8104843a/README.md) when testing my codemod. For more information on the v5 API change, please see the [release notes](https://github.com/nfl/react-helmet/pull/246)

This codemod saved us a bunch of time for Docker Store, so I hope it is helpful for you too! Since everyone has different use cases, let me know if you have any examples that I could add to the tests and handle!

## Example

#### Input
[Old React-Helmet readme](https://github.com/nfl/react-helmet/blob/f392aaef69cce3cd1951dd96e4f860bf8104843a/README.md)

```
import React from "react";
import Helmet from "react-helmet";

export default function Application () {
    return (
        <div className="application">
            <Helmet
                htmlAttributes={{lang: "en", amp: undefined}} // amp takes no value
                title="My Title"
                titleTemplate="MySite.com - %s"
                defaultTitle="My Default Title"
                titleAttributes={{itemprop: "name", lang: "en"}}
                base={{target: "_blank", href: "http://mysite.com/"}}
                meta={[
                    {name: "description", content: "Helmet application"},
                    {property: "og:type", content: "article"}
                ]}
                link={[
                    {rel: "canonical", href: "http://mysite.com/example"},
                    {rel: "apple-touch-icon", href: "http://mysite.com/img/apple-touch-icon-57x57.png"},
                    {rel: "apple-touch-icon", sizes: "72x72", href: "http://mysite.com/img/apple-touch-icon-72x72.png"}
                ]}
                script={[
                    {src: "http://include.com/pathtojs.js", type: "text/javascript"},
                    {type: "application/ld+json", innerHTML: `{ "@context": "http://schema.org" }`}
                ]}
                noscript={[
                    {innerHTML: `<link rel="stylesheet" type="text/css" href="foo.css" />`}
                ]}
                style={[
                  {type: "text/css", cssText: "body {background-color: blue;} p {font-size: 12px;}"}
                ]}
                onChangeClientState={(newState) => console.log(newState)}
            />
        </div>
    );
};
```

#### Output
Below is actual output. Note that it matches the new [React-Helmet README](https://github.com/nfl/react-helmet)
```
import React from "react";
import Helmet from "react-helmet";

export default function Application () {
    return (
        <div className="application">
            <Helmet
                titleTemplate="MySite.com - %s"
                defaultTitle="My Default Title"
                onChangeClientState={(newState) => console.log(newState)}>
                <html lang="en" amp />
                <title itemprop="name" lang="en">My Title</title>
                <base target="_blank" href="http://mysite.com/" />
                <meta name="description" content="Helmet application" />
                <meta property="og:type" content="article" />
                <link rel="canonical" href="http://mysite.com/example" />
                <link
                    rel="apple-touch-icon"
                    href="http://mysite.com/img/apple-touch-icon-57x57.png" />
                <link
                    rel="apple-touch-icon"
                    sizes="72x72"
                    href="http://mysite.com/img/apple-touch-icon-72x72.png" />
                <script src="http://include.com/pathtojs.js" type="text/javascript" />
                <script type="application/ld+json">{`{ "@context": "http://schema.org" }`}</script>
                <noscript>{`<link rel="stylesheet" type="text/css" href="foo.css" />`}</noscript>
                <style type="text/css">{"body {background-color: blue;} p {font-size: 12px;}"}</style>
            </Helmet>
        </div>
    );
};
```

## Usage

Install `jscodeshift` using `npm` or `yarn`
```
// yarn
yarn global add jscodeshift

// or npm
npm i -g jscodeshift
```

Clone this repository
```
git clone https://github.com/kristiehoward/react-helmet-v5-codemod.git
```

Install the dependencies using `npm` or `yarn` in the `react-helmet-v5-codemod` directory
```
// yarn
yarn install

// or npm
npm i
```

Run `jscodeshift` with this transform on your files. You can use the `-d` option to do a dry run on your files, and the `-p` option to print the results.
```
// Usage
jscodeshift -t <codemod-script> <path-to-your-file>

// Do a dry run of this transform on the __testfixtures__/ directory and print the results
jscodeshift -t src/transform.js src/__testfixtures__ -d -p

// Do a dry run of this transform on a single file and print the results
jscodeshift -t src/transform.js /path/to/my/file.js -d -p

// Actually run the transform on your files
jscodeshift -t src/transform.js /path/to/my/file.js
```

## Testing
Tests use Jest and Jest Snapshots. The input files are located in `src/__testfixtures__`. For all the tests defined in `__tests__/transform.spec.js`, jest will look for the matching file in the test fixtures, run it through the codemod, and expect for the output to match the snapshot defined in `__tests__/__snapshots__` for that test case. For one example (testing the spread operator), we want the transform to throw an error, so Jest expects an error.

Test coverage is at 100% for the `transform.js` file where the codemod is actually located. If you think of a new use case or edge case, please let me know and I can add it to the tests.

How to run the tests
```
// run the tests using jest and yarn
yarn test
// or npm
npm test

// run the test using jest and yarn, with coverage printed out
yarn test -- --coverage
```

## TODOs

- [x] Run tests using jest
- [ ] Ensure `bodyAttributes` works - need to find an example of someone using this

## Known Issues

This codemod works best when the values of the props are strings, objects, or arrays.

If a prop like `meta` or `script` that takes an array of objects is given a function or a variable, it will create a tag with that name, put the value as the children of that tag, and add a comment above the tag saying that it is unable to translate the following code. The warning and comment should be enough of an indication for you to go back and fix it manually.

Example:

```
<Helmet
  meta={meta}
  script={getScripts()}
/>
```

becomes

```
<Helmet>
   {/*WARNING: Unable to translate the following tag*/
   }<meta>{meta}</meta>
   {/*WARNING: Unable to translate the following tag*/
   }<script>{getScripts()}</script>
 </Helmet>
 ```
