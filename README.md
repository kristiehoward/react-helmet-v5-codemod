# react-helmet-v5-codemod

Codemod built using jscodeshift to upgrade to version 5 of react-helmet.

[React Helmet](https://github.com/nfl/react-helmet) recently released a new version which makes the API much simpler moving forward. We are using react-helmet in over 40 different files in Docker Store, so I figured it would be best to write a codemod using jscodeshift instead of manually fixing the issues.

This is my first codemod so suggestions welcome!

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
jscodeshift -t <codemod-script> <path>

// Do a dry run of this transform on the tests/ directory and print the results
jscodeshift -t transform.js tests/ -d -p

// Do a dry run of this transform on a single file and print the results
jscodeshift -t transform.js /path/to/my/file.js -d -p
```

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
