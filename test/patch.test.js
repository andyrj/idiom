import test from "ava";
import { h } from "../src/h";
import { patch } from "../src/patch";

require("undom/register");

test.beforeEach(() => {
  document.body = document.createElement("body");
});

test("patch should render textNodes properly", t => {
  const str = "test";
  patch(document.body, null, null, str);
  t.is(document.body.childNodes[0].nodeValue, str);
});

test("patch should update textNodes without replacment", t => {
  const str = "test";
  const str1 = "test1";
  patch(document.body, null, null, str);
  t.is(document.body.childNodes[0].nodeValue, str);
  patch(document.body, document.body.childNodes[0], str, str1);
  t.is(document.body.childNodes[0].nodeValue, str1);
});

test("patch should replace textNode with domNode when needed", t => {
  const str1 = "test1";
  patch(document.body, null, null, str1);
  t.is(document.body.childNodes[0].nodeValue, str1);

  const node = h("div", { id: "test" }, []);
  patch(document.body, document.body.childNodes[0], str1, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
});

test("patch should remove nodes no in patch", t => {
  const str1 = "test1";
  patch(document.body, null, null, str1);
  t.is(document.body.childNodes[0].nodeValue, str1);

  patch(document.body, document.body.childNodes[0], str1, null);
  t.is(document.body.childNodes.length, 0);
});

test("patch should skip memoized nodes", t => {
  const node = h("div", { id: "test" }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
  patch(document.body, document.body.childNodes[0], node, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
});

test("patch should update domNodes", t => {
  const node = h("div", { id: "test", class: "t1" }, []);
  patch(document.body, null, null, node);
  let n = document.body.childNodes[0];
  let attrs = n.attributes;
  t.is(n.nodeName, "DIV");
  t.is(attrs.filter(attr => attr.name === "id")[0].value, "test");
  t.is(attrs.filter(attr => attr.name === "class")[0].value, "t1");
  const node1 = h("div", { id: "test1" }, []);
  patch(document.body, document.body.childNodes[0], node, node1);
  n = document.body.childNodes[0];
  attrs = n.attributes;
  t.is(n.nodeName, "DIV");
  t.is(attrs.filter(attr => attr.name === "id")[0].value, "test1");
  t.is(attrs.length, 1);
  const node2 = h("div", { id: "test1", value: "foo" }, []);
  patch(document.body, document.body.childNodes[0], node1, node2);
  n - document.body.childNodes[0];
  attrs = n.attributes;
  t.is(n.nodeName, "DIV");
  t.is(attrs.filter(attr => attr.name === "id")[0].value, "test1");
  t.is(attrs.filter(attr => attr.name === "value")[0].value, "foo");
  t.is(attrs.length, 2);
});

test("patch should add child nodes", t => {
  const node = h("div", { id: "test" }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].nodeName, "DIV");
  t.is(document.body.childNodes[0].id, "test");
  const str = "test"
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, document.body.childNodes[0], node, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, "test");
});

test("patch should remove child nodes", t => {
  const str = "test";
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, null, null, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
  const node = h("div", { id: "test" }, []);
  patch(document.body, document.body.childNodes[0], children, node);  
  t.is(document.body.childNodes[0].childNodes.length, 0);
});

test("should not ouptut key attribute", t => {
  const node = h("div", { key: 1 }, []);
  patch(document.body, null, null, node);
  t.is(document.body.childNodes[0].attributes.length, 0);
});

test("patch should update un-keyed child nodes", t => {
  const str = "test";
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, null, null, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
  const children1 = h("div", { id: "test" }, [
    h("div", {}, [str]),
    h("h1", {}, [str])
  ]);
  patch(document.body, document.body.childNodes[0], children, children1);
  t.is(document.body.firstChild.firstChild.nodeName, "DIV");
  t.is(document.body.firstChild.firstChild.firstChild.nodeValue, str);
  t.is(document.body.firstChild.lastChild.nodeName, "H1");
  t.is(document.body.firstChild.lastChild.firstChild.nodeValue, str);
  patch(document.body, document.body.childNodes[0], children1, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
});

test("null keys should still be handled as un-keyed", t => {
  const str = "test";
  const children = h("div", { id: "test" }, [str]);
  patch(document.body, null, null, children);
  t.is(document.body.childNodes[0].childNodes[0].nodeValue, str);
  const children1 = h("div", { id: "test" }, [
    h("div", { key: null }, [str]),
    h("h1", { key: null }, [str])
  ]);
  patch(document.body, document.body.childNodes[0], children, children1);
  t.is(document.body.firstChild.firstChild.nodeName, "DIV");
  t.is(document.body.firstChild.firstChild.firstChild.nodeValue, str);
  t.is(document.body.firstChild.lastChild.nodeName, "H1");
  t.is(document.body.firstChild.lastChild.firstChild.nodeValue, str);
  const children2 = h("div", { id: "test" }, [
    h("h1", { key: null }, [str]),
    h("div", { key: null }, [str])
  ]);
  patch(document.body, document.body.childNodes[0], children1, children2);
  t.is(document.body.firstChild.firstChild.nodeName, "H1");
  t.is(document.body.firstChild.firstChild.firstChild.nodeValue, str);
  t.is(document.body.firstChild.lastChild.nodeName, "DIV");
  t.is(document.body.firstChild.lastChild.firstChild.nodeValue, str);
});

test("should add to keyed children", t => {
  const c1 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"])
  ];
  const node1 = h("div", {}, c1);
  patch(document.body, null, null, node1);
  let n = document.body.firstChild;
  let children = n.childNodes;
  t.is(children.length, 3);
  const c2 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ]
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 4);
  t.is(children[0].firstChild.nodeValue, "0");
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "2");
  t.is(children[3].firstChild.nodeValue, "3");
  const c3 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 4}, ["4"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ];
  const node3 = h("div", {}, c3);
  patch(document.body, document.body.firstChild, node2, node3);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 5);
  t.is(children[0].firstChild.nodeValue, "0");
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "4");
  t.is(children[3].firstChild.nodeValue, "2");
  t.is(children[4].firstChild.nodeValue, "3");
  const c4 = [
    h("div", {key: 5}, ["5"]),
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 4}, ["4"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ];
  const node4 = h("div", {}, c4);
  patch(document.body, document.body.firstChild, node3, node4);
  n = document.body.firstChild;
  children = n.childNodes;
  t.is(children.length, 6);
  t.is(children[0].firstChild.nodeValue, "5");
  t.is(children[1].firstChild.nodeValue, "0");
  t.is(children[2].firstChild.nodeValue, "1");
  t.is(children[3].firstChild.nodeValue, "4");
  t.is(children[4].firstChild.nodeValue, "2");
  t.is(children[5].firstChild.nodeValue, "3");
});

test("keyed nodes should diff correctly", t => {
  const c1 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"]),
    h("div", {key: 4}, ["4"])
  ];
  const node1 = h("div", {}, c1);
  patch(document.body, null, null, node1);
  t.is(document.body.firstChild.childNodes.length, 5);
  const c2 = [
    h("div", {key: 0}, ["4"]),
    h("div", {key: 1}, ["3"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["1"]),
    h("div", {key: 4}, ["0"])
  ];
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  t.is(document.body.firstChild.childNodes.length, 5);
  let children = document.body.firstChild.childNodes;
  t.is(children[0].firstChild.nodeValue, "4");
  t.is(children[1].firstChild.nodeValue, "3");
  t.is(children[2].firstChild.nodeValue, "2");
  t.is(children[3].firstChild.nodeValue, "1");
  t.is(children[4].firstChild.nodeValue, "0");
});

test("keyed nodes should remove properly", t => {
  const c1 = [
    h("div", {key: 0}, ["0"]),
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"]),
    h("div", {key: 4}, ["4"])
  ];
  const node1 = h("div", {}, c1);
  patch(document.body, null, null, node1);
  t.is(document.body.firstChild.childNodes.length, 5);
  const c2 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"]),
    h("div", {key: 4}, ["4"])
  ];
  const node2 = h("div", {}, c2);
  patch(document.body, document.body.firstChild, node1, node2);
  t.is(document.body.firstChild.childNodes.length, 4);
  let children = document.body.firstChild.childNodes;
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "2");
  t.is(children[3].firstChild.nodeValue, "3");
  t.is(children[4].firstChild.nodeValue, "4");
  const c3 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 2}, ["2"]),
    h("div", {key: 3}, ["3"])
  ];
  const node3 = h("div", {}, c3);
  patch(document.body, document.body.firstChild, node2, node3);
  t.is(document.body.firstChild.childNodes.length, 3);
  children = document.body.firstChild.childNodes;
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[2].firstChild.nodeValue, "2");
  t.is(children[3].firstChild.nodeValue, "3");
  const c4 = [
    h("div", {key: 1}, ["1"]),
    h("div", {key: 3}, ["3"])
  ];
  const node4 = h("div", {}, c4);
  patch(document.body, document.body.firstChild, node3, node4);
  t.is(document.body.firstChild.childNodes.length, 2);
  children = document.body.firstChild.childNodes;
  t.is(children[1].firstChild.nodeValue, "1");
  t.is(children[3].firstChild.nodeValue, "3");
});
