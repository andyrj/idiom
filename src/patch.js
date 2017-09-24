// from hyperapp patch...
//const globalInvokeLaterStack = [];

function diffAttributes(element, oldProps, newProps) {
  const oldPropKeys = Object.keys(oldProps).filter(name => name !== "key");
  const newPropKeys = Object.keys(newProps).filter(name => name !== "key");
  if (newPropKeys.length === 0) {
    oldPropKeys.forEach(key => {
      setData(element, key);
    });
  } else {
    // remove props in old not found in new
    oldPropKeys.forEach(key => {
      if (newPropKeys.indexOf(key) === -1) {
        setData(element, key);
      }
    });
    // add/update new props
    newPropKeys.forEach(key => {
      setData(element, key, newProps[key]);
    });
  }
}

function setData(element, key, value) {
  // ignoring keyed nodes for this draft...
  // not supporting inline styles in this draft...
  if (key === "key") {
    return; // short circuit keyed node case...
  }
  try {
    element[key] = value;
  } catch (_) {} // eslint-disable-line no-empty

  if (typeof value !== "function") {
    if (value) {
      element.setAttribute(key, value);
    } else {
      element.removeAttribute(key);
    }
  }
}

function createElement(node) {
  if (typeof node === "string") {
    return document.createTextNode(node);
  } else {
    // not surpporting svg in this draft...
    const element = document.createElement(node.tag);
    /* life cycle oncreate from hyperapp
    if (node.props && node.props.oncreate) {
      globalInvokeLaterStack.push(function() {
        node.props.oncreate(element);
      });
    }
    */
    Object.keys(node.props).forEach(key => {
      setData(element, key, node.props[key]);
    });

    node.children.forEach(child => {
      element.appendChild(createElement(child));
    });
    return element;
  }
}

function getComparator(instruction) {
  if (instruction.type === "add") {
    return instruction.nNode.index;
  } else {
    return instruction.oNode.index;
  }
}

function instructionOrder(a, b) {
  const aComp = getComparator(a);
  const bComp = getComparator(b);
  if (aComp < bComp) {
    return -1;
  } else if (aComp > bComp) {
    return 1;
  } else {
    return 0;
  }
}

function reconcile(element, instructions, oldChildren) {
  const sortedInstructions = instructions.sort(instructionOrder);
  //let at = 0;
  //let o = 0;
  //let n = 0;
  while (sortedInstructions.length > 0) {
    const instruction = sortedInstructions.shift();
    /*
    if (instruction.type === "remove") {
      element.removeChild(curr);
      o++;
    } else*/ 
    if (instruction.type === "add") {
      const curr = element.children[instruction.nNode.index];
      element.insertAfter(createElement(instruction.nNode.node), curr);
      //n++;
    } /*else if (instruction.type === "diff") {
      const oldNode = instruction.oNode;
      const node = instruction.nNode;
      patch(element, curr, oldNode, node);
      o++;
      n++;
    } else {
      // swap case is most complicated...
      // make test for swaps...
    }
    */
  }
}

function unkeyed(parent, oldNodes, nodes) {
  let i = 0;
  while (i < oldNodes.length && i < nodes.length) {
    patch(parent, parent.childNodes[i], oldNodes[i], nodes[i]);
    i++;
  }
  if (i === oldNodes.length) {
    while (i < nodes.length) {
      parent.appendChild(createElement(nodes[i]));
      i++;
    }
  } else if (i === nodes.length) {
    while (i < oldNodes.length) {
      parent.removeChild(parent.childNodes[i]);
      i++;
    }
  }
}

function keyed(parent, oldNodes, nodes) {
  const instructions = []; // { type: "add" | "remove" | "diff" | "swap", oNode?: { index, node }, nNode?: { index, node} }
  const nodeMap = {}; // { [id]: {oNode: {index, node}, nNode: {index, node} } }
  
  oldNodes.forEach((child, index) => {
    const key = child.props.key;
    nodeMap[key] = { oNode: { index, node: child } };
  });

  nodes.forEach((child, index) => {
    const key = child.props.key;
    if (nodeMap[key] === undefined) {
      instructions.unshift({ type: "add", nNode: { index, child } });
    }
  });
  // refactor this code...  can't do with forEach need loop with 2 counters... 
  /*
  
  nodes.forEach((child, index) => {
    const id = child.props.id;
    if (nodeMap[id] !== undefined) {
      const nNode = { index, node: child };
      const oNode = nodeMap[id].oNode;
      nodeMap[id].nNode = nNode;
      if (nodeMap[id].oNode.index === index) {
        instructions.push({ type: "diff", nNode, oNode });
      } else {
        instructions.push({ type: "swap", nNode, oNode });
      }
    } else {
      instructions.push({ type: "add", new: { index, child } });
    }
  });
  Object.keys(nodeMap).forEach(nodeEntry => {
    if (nodeEntry.nNode === undefined) {
      const oNode = nodeEntry.oNode;
      instructions.unshift({ type: "remove", oNode });
    }
  });
  */
  console.log(JSON.stringify(instructions));
  reconcile(parent, instructions, oldNodes);
}

function diffChildren(parent, oldNodes, nodes) {
  if (oldNodes.length === 0 && nodes.length > 0) {
    // short circuit for no children -> children
    nodes.forEach(child => {
      parent.appendChild(createElement(child));
    });
  } else if (oldNodes.length > 0 && nodes.length === 0) {
    // short circuit for children -> no children
    while (parent.lastChild) {
      parent.removeChild(parent.lastChild);
    }
  } else {
    if (
      oldNodes[0].props &&
      nodes[0].props &&
      oldNodes[0].props.key != null &&
      nodes[0].props.key != null
    ) {
      keyed(parent, oldNodes, nodes);
    } else {
      unkeyed(parent, oldNodes, nodes);
    }
  }
}

export function patch(parent, element, oldNode, node) {
  if (oldNode == null && node != null) {
    // create new element and add to parent...
    element = parent.insertBefore(createElement(node), element);
  } else if (element != null && oldNode != null && node != null) {
    if (oldNode === node) {
      return element; // short circuit for memoized vnode
    } else if (typeof oldNode === "string" && typeof node === "string") {
      element.nodeValue = node; // short cut for upating textNode
    } else if (oldNode.tag && node.tag && oldNode.tag === node.tag) {
      // diff attributes
      diffAttributes(element, oldNode.props, node.props);
      // diff children if either oldNode or node have children
      if (oldNode.children.length > 0 || node.children.length > 0) {
        diffChildren(element, oldNode.children, node.children);
      }
    } else {
      // replace oldNode with node in dom...
      parent.replaceChild(createElement(node), element);
    }
  } else if (element != null && oldNode != null && node == null) {
    /* lifecycle onremove from hyperapp
    if (oldNode.props && oldNode.props.onremove) {
      globalInvokeLaterStack.push(oldNode.props.onremove(element));
    }
    */
    parent.removeChild(element);
  }
  return element;
}
