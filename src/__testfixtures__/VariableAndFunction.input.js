import React, { Component } from 'react';
import { connect } from 'react-redux';

export default class Root extends Component {
  static propTypes = {
    children: node.isRequired,
    location: object.isRequired,
    params: object.isRequired,
  }

  render() {
    // Pick meta tags based on environment
    const meta = !isProd() ?
      [{ name: 'robots', content: 'noindex' }] : [];
    // Some function that could be running
    const getScripts = () => { return [{}] };
    return (
      <div>
        <Helmet
          titleTemplate={'%s - Docker Store'}
          meta={meta}
          script={getScripts()}
          title={"123" === "123" ? "Something" : "Another Thing"}
        />
        <div id="mainContainer" className={mainClasses}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
