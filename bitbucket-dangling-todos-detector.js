// ==UserScript==
// @name         Bitbucket Dangling TODOs Detector
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://bitbucket.org/*/pull-requests/*/*
// @grant        none
// ==/UserScript==

(function() {
  "use strict";

  function onDiffLoaded(cb, attempt = 0) {
    const diff = document.querySelector("#pullrequest-diff");

    if (diff) {
      cb();

      return;
    }

    if (attempt >= 50) {
      console.log("No diff found");

      return;
    }

    setTimeout(() => onDiffLoaded(cb, attempt + 1), 500);
  }

  onDiffLoaded(function() {
    const checks = ["TODO:", "FIXME:"];

    const danglingTodos = Array.from(
      document.querySelectorAll(".addition .source")
    )
      .filter(node => checks.some(check => node.textContent.includes(check)))
      .reduce(function(todosByFilename, node) {
        const check = checks.find(check => node.textContent.includes(check));

        const filename = node.parentElement.parentElement.parentElement.parentElement
          .querySelector(".heading .filename")
          .innerText.split(" ")[1];
        const lineNumber = node.parentElement.querySelector(".line-numbers")
          .dataset.tnum;
        const todo = node.textContent;
        const href = "#" + node.parentElement.querySelector(".gutter").id;

        todosByFilename[filename] = (todosByFilename[filename] || []).concat({
          check,
          todo,
          lineNumber,
          href
        });

        return todosByFilename;
      }, {});

    const numDanglingTodos = Object.entries(danglingTodos).reduce(
      (accu, [filename, todos]) => accu + todos.length,
      0
    );

    const output =
      Object.keys(danglingTodos).length == 0
        ? "<div>✅ No dangling TODOs</div>"
        : `<div><strong>⚠️ ${numDanglingTodos} dangling TODOs!</strong>\n\n<ul>` +
          Object.entries(danglingTodos)
            .map(([filename, todos]) => {
              return `
                      <li>
                          ${filename}
                          <ul>
                              ${todos
                                .map(({ check, lineNumber, todo, href }) => {
                                  return `<li><a href="${href}">L${lineNumber} ${todo.replace(
                                    new RegExp(`^.*${check}`),
                                    check
                                  )}</a></li>`;
                                })
                                .join("\n")}
                          </ul>
                      </li>
                  `;
            })
            .join("") +
          "</ul></div>";

    document
      .querySelector(
        "#pull-request-diff-header > div.aui-item.main > dl > .description > dd"
      )
      .appendChild(createElementFromHTML(output));

    function createElementFromHTML(htmlString) {
      var div = document.createElement("div");
      div.innerHTML = htmlString.trim();

      // Change this to div.childNodes to support multiple top-level nodes
      return div.firstChild;
    }
  });
})();
