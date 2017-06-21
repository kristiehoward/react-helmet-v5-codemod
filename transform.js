module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Given text, return a comment that can be used as children to a JSX element
  const createComment = text => {
    const el = j.jsxEmptyExpression();
    el.comments = [j.block(text)];
    return j.jsxExpressionContainer(el);
  };


  // Keep track of any title attributes we may find so we can apply them after
  let titleAttributes = [];

  // Return true if the JSXAttribute supplied should be left in props
  const isPropAttr = a => {
    // The following attributes are the only ones that should be left as props
    return ["defaultTitle", "encodeSpecialCharacters", "onChangeClientState", "titleTemplate"].includes(a.name.name);
  };

  // Return true if the Property supplied should be given as a child instead of
  // a prop when creating a new jsxElement
  const isChildProperty = p => {
    const name = (p.name && p.name.name) || (p.key && p.key.name);
    return name === "innerHTML" || name === "cssText";
  };

  // Given a property, return a jsxExpressionContainer with that property inside
  const convertPropertyToContainer = prop => {
    // amp=undefined
    if (prop.value.type === "Identifier") {
      return null;
    }
    const contents = prop.value.type === "Literal"
      ? j.literal(prop.value.rawValue)
      : j.templateLiteral(prop.value.quasis, prop.value.expressions);
    return j.jsxExpressionContainer(contents);
  };

  // Converts object property to a jsxAttribute to be used on a jsxElement
  // ex: {name: "description"}
  // gets converted into a jsxAttribute with name="description"
  const convertPropertyToAttr = prop => {
    const value = prop.value.value
      ? j.literal(prop.value.value)
      : // protect against template literals
        convertPropertyToContainer(prop);
    return j.jsxAttribute(j.jsxIdentifier(prop.key.name), value);
  };

  // Given a name, an array of jsx attributes, and an array of children, return
  // a jsxElement with those attributes and children
  const createElementWithAttrsAndChildren = (name, attrs, children) => {
    const opening = j.jsxOpeningElement(name);
    opening.attributes = attrs;
    return j.jsxElement(opening, j.jsxClosingElement(name), children);
  };

  // Given a name and an array of jsx attributes, return a self closing
  // jsxElement with those attributes
  const createSelfClosingElementWithAttrs = (name, attrs) => {
    const tag = j.jsxOpeningElement(name);
    tag.selfClosing = true;
    tag.attributes = attrs;
    return tag;
  };

  // Given an attribute from the <Helmet> element, create a tag with the
  // value of the expression as a JSX container body
  // and comments surrounding it so that the user can easily find them
  // Ex: meta={getMeta()} ==> <meta>{getMeta()}</meta>
  const convertAttrToCommentedTags = a => {
    const comment = createComment("WARNING: Unable to translate the following tag");
    const children = [j.jsxExpressionContainer(a.value.expression)];
    return [comment, createElementWithAttrsAndChildren(a.name, [], children)];
  };

  // Given properties, an array for attributes, and an array for children,
  // convert each property to a container or an array and save them in either
  // the attributes or children arrays
  const convertPropertiesToTag = (properties, name) => {
    const attrs = [];
    const children = [];
    properties.forEach(p => {
      if (isChildProperty(p)) {
        // create jsxcontainer and push onto children
        children.push(convertPropertyToContainer(p));
      } else {
        attrs.push(convertPropertyToAttr(p));
      }
    });
    const tag = children.length
      ? createElementWithAttrsAndChildren(name, attrs, children)
      : createSelfClosingElementWithAttrs(name, attrs);
    return tag;
  };

  // Given an attribute (prop) on the <Helmet> tag, convert it into the
  // appropriate tag(s) and return an array of tags
  const convertAttrToTags = a => {
    const tags = [];
    const type = a.name.name;
    let tag;

    switch (type) {
      case "title":
        tags.push(createElementWithAttrsAndChildren(a.name, [], [a.value]));
        tags.push(j.literal("\n"));
        break;
      case "titleAttributes":
        // Create and save jsx attributes that we can later apply to the <title>
        titleAttributes = a.value.expression.properties.map(convertPropertyToAttr);
        break;
      case "htmlAttributes":
        // Create an <html> tag with those attributes
        const htmlAttrs = a.value.expression.properties.map(convertPropertyToAttr);
        a.name.name = "html";
        tag = createSelfClosingElementWithAttrs(a.name, htmlAttrs);
        tags.push(tag, j.literal("\n"));
        break;
      case "base":
        tag = convertPropertiesToTag(a.value.expression.properties, a.name);
        tags.push(tag, j.literal("\n"));
        break;
      case "meta":
      case "link":
      case "script":
      case "noscript":
      case "style":
        // Could be a different JSX expression - either way, we don't know how
        // to translate this, so mark it with a comment for the user to translate
        // by hand. ex. meta={getMeta()} instead of meta={{ ... }}
        if (a.value.expression && !a.value.expression.elements) {
          tags.push(...convertAttrToCommentedTags(a), j.literal("\n"));
          break;
        }
        a.value.expression.elements.forEach(e => {
          tag = convertPropertiesToTag(e.properties, a.name);
          tags.push(tag, j.literal("\n"));
        });
        break;
      default:
    }
    return tags;
  };

  let result = root.findJSXElements("Helmet").replaceWith(p => {
    const children = [j.literal("\n")];
    // For each of the <Helmet> attributes, process them and add them to the
    // children array if appropriate
    p.node.openingElement.attributes.forEach(a => {
      if (a.type === "JSXSpreadAttribute") {
        throw new Error("Cannot process JSX spread attributes");
      }
      // Do nothing if the attribute should remain as a prop on the <Helmet> tag
      if (isPropAttr(a)) {
        return;
      }
      const newTags = convertAttrToTags(a);
      children.push(...newTags);
    });
    const name = p.node.openingElement.name;
    // Remove the props that are now children
    const attrs = p.node.openingElement.attributes.filter(isPropAttr);
    const replacement = createElementWithAttrsAndChildren(name, attrs, []);
    // Some weird bug where it wont work with children in the previous step
    replacement.children = children;
    return replacement;
  });
  // If there are titleAttributes found, add those to the <title> tag
  if (titleAttributes && titleAttributes.length) {
    result = result.findJSXElements("title").replaceWith(p => {
      return createElementWithAttrsAndChildren(p.node.name, titleAttributes, p.node.children);
    });
  }
  return result.toSource();
};
