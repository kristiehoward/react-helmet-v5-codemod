import React from "react";
import Helmet from "react-helmet";

// We should expect an error because we don't know how to process spread props
export default function Application () {
  const helmetProps = !isProd() ? { title: name } : {
    title: name,
    meta: [{ name: 'description', content: short_description }],
  };
  return (
    <div>
      <Helmet {...helmetProps} />
    </div>
  );
}
