// import React from "react";
// import Helmet from "react-helmet";

// Previous react-helmet readme before v5.0.0
// https://github.com/nfl/react-helmet/blob/f392aaef69cce3cd1951dd96e4f860bf8104843a/README.md

export default function Application() {
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
