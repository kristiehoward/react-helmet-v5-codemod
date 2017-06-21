import React from "react";
import Helmet from "react-helmet";

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
