export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Keep track of any title attributes we may find so we can apply them after
  let titleAttributes = [];

  // Return true if the JSXAttribute supplied should be left in props
  const isPropAttr = a => {
    const name = a.name.name;
    return name === "defaultTitle" || name === "titleTemplate" || name === "onChangeClientState";
  };

  // Return true if the Property supplied should be given as a child instead of
  // a prop when creating a new jsxElement
  const isChildProperty = p => {
    const name = (p.name && p.name.name) || (p.key && p.key.name);
    return name === "innerHTML" || name === "cssText";
  };

  // Given a property, return a jsxExpressionContainer with that property inside
  const convertPropertyToContainer = prop => {
    const contents = prop.value.type === "Literal" ? j.literal(prop.value.rawValue) : j.templateLiteral(prop.value.quasis, prop.value.expressions);
    return j.jsxExpressionContainer(contents);
  };

  // Converts object property to a jsxAttribute to be used on a jsxElement
  // ex: {name: "description"}
  // gets converted into a jsxAttribute with name="description"
  const convertPropertyToAttr = prop => {
    const value = prop.value.value ?
      j.literal(prop.value.value) :
      // protect against template literals
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

  // Given an attribute (prop) on the <Helmet> tag, convert it into the appropriate
  // tag(s) and return an array of tags
  const convertAttrToTags = a => {
    const tags = [];
    const type = a.name.name;

    if (type === "title") {
      // <title>{value}</title>
      tags.push(createElementWithAttrsAndChildren(a.name, [], [a.value]));
    }
    if (type === "titleAttributes") {
      // Create jsx attributes that we can later apply to the title element
      titleAttributes = a.value.expression.properties.map(convertPropertyToAttr);
    }
    if (type === "htmlAttributes") {
      // Create an <html> tag with those attributes
      const attrs = a.value.expression.properties.map(convertPropertyToAttr);
      a.name.name = "html";
      const tag = createSelfClosingElementWithAttrs(a.name, attrs);
      tags.push(tag);
    }

    if (a.value.expression && a.value.expression.type === "ArrayExpression") {
      // For each of the array elements
      a.value.expression.elements.forEach(e => {
        const attrs = [];
        const children = [];
        // Create an array of attributes to give to the new tag
        e.properties.forEach(p => {
          if (isChildProperty(p)) {
            // create jsxcontainer and push onto children
            children.push(convertPropertyToContainer(p));
          } else {
            attrs.push(convertPropertyToAttr(p));
          }
        });
        const tag = children.length
          ? createElementWithAttrsAndChildren(a.name, attrs, children)
          : createSelfClosingElementWithAttrs(a.name, attrs);
        tags.push(tag);
        tags.push(j.literal("\n"));
      });
    }

    return tags;
  };

  const processAttr = children => a => {
    // Do nothing if the attribute should remain as a prop on the <Helmet> tag
    if (isPropAttr(a)) {
      return;
    }
    const newTags = convertAttrToTags(a);
    children.push(...newTags);
    children.push(j.literal("\n"));
  };

  let result = root.findJSXElements("Helmet").replaceWith(p => {
    const children = [j.literal("\n")];
    // For each of the <Helmet> attributes, process them and add them to the
    // children array if appropriate
    p.node.openingElement.attributes.forEach(processAttr(children));
    const name = p.node.openingElement.name;
    // Remove the props that are now children
    const attrs = p.node.openingElement.attributes.filter(isPropAttr);
    const replacement = createElementWithAttrsAndChildren(name, attrs, []);
	   // Some weird bug where it wont work with children in the previous step
    replacement.children = children;
    return replacement;
  });
  if (titleAttributes && titleAttributes.length) {
    result = result.findJSXElements("title").replaceWith(p => {
      return createElementWithAttrsAndChildren(p.node.name, titleAttributes, p.node.children);
    });
  }
  return result.toSource();
}
