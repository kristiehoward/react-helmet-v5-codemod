import React from "react";
import Helmet from "react-helmet";

// The resulting <Helmet> tag should be self closing
export default function Application () {
    return (
        <div className="application">
            <Helmet
                titleTemplate="MySite.com - %s"
                defaultTitle="My Default Title"
            />
        </div>
    );
};
