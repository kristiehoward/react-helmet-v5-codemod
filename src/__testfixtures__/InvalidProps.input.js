import React from "react";
import Helmet from "react-helmet";

// Put some invalid (unrecognized) props on Helmet that should get stripped out
export default function Application () {
    return (
        <div className="application">
            <Helmet
                titleTemplate="MySite.com - %s"
                defaultTitle="My Default Title"
                randomProp="lol-fail-me"
            />
        </div>
    );
};
